/**
 * Phase G1: Platform Resource Persistence Regression Tests
 *
 * Comprehensive tests for all 7 MedXAI platform resource types:
 * Project, User, ProjectMembership, Login, ClientApplication, AccessPolicy, JsonWebKey
 *
 * Covers:
 * 1. CRUD operations (create, read, update, delete)
 * 2. Search column physical value verification
 * 3. Reference fields & compartments
 * 4. History integrity
 * 5. Cross-project isolation
 * 6. Concurrent safety (FOR UPDATE)
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
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../../repo/errors.js';
import type { FhirResource, OperationContext } from '../../repo/types.js';

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
let spRegistry: SearchParameterRegistry;

const RUN_ID = randomUUID().slice(0, 8);
const PROJECT_A = randomUUID();
const PROJECT_B = randomUUID();

// Track all created resource IDs for cleanup
const createdResources: Array<{ type: string; id: string }> = [];

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

  // Load FHIR R4 search parameters
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const specDir = resolve(scriptDir, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
  const platformDir = resolve(scriptDir, '..', '..', '..', '..', '..', 'spec', 'platform');

  const spBundlePath = resolve(specDir, 'search-parameters.json');
  if (!existsSync(spBundlePath)) {
    throw new Error(`search-parameters.json not found at ${spBundlePath}`);
  }

  spRegistry = new SearchParameterRegistry();
  const spBundle = JSON.parse(readFileSync(spBundlePath, 'utf8')) as SearchParameterBundle;
  spRegistry.indexBundle(spBundle);

  // Load platform search parameters
  const platformSpPath = resolve(platformDir, 'search-parameters-medxai.json');
  if (existsSync(platformSpPath)) {
    const platformSpBundle = JSON.parse(readFileSync(platformSpPath, 'utf8')) as SearchParameterBundle;
    spRegistry.indexBundle(platformSpBundle);
  }

  repo = new FhirRepository(db, spRegistry);
}, 30_000);

afterAll(async () => {
  // Clean up all created resources
  for (const { type, id } of createdResources.reverse()) {
    try {
      await db.query(`DELETE FROM "${type}_History" WHERE "id" = $1`, [id]);
    } catch { /* ignore */ }
    try {
      await db.query(`DELETE FROM "${type}_References" WHERE "resourceId" = $1`, [id]);
    } catch { /* ignore */ }
    try {
      await db.query(`DELETE FROM "${type}" WHERE "id" = $1`, [id]);
    } catch { /* ignore */ }
  }

  if (db && !db.isClosed) {
    await db.close();
  }
});

// =============================================================================
// Helpers
// =============================================================================

function track(type: string, id: string): void {
  createdResources.push({ type, id });
}

function makeProject(overrides?: Record<string, unknown>): FhirResource {
  return {
    resourceType: 'Project',
    name: `TestProject-${RUN_ID}`,
    description: 'G1 regression test project',
    ...overrides,
  };
}

function makeUser(overrides?: Record<string, unknown>): FhirResource {
  return {
    resourceType: 'User',
    email: `user-${RUN_ID}@medxai.test`,
    firstName: 'Test',
    lastName: 'User',
    passwordHash: '$2b$10$fakehash',
    ...overrides,
  };
}

function makeProjectMembership(
  projectRef: string,
  userRef: string,
  overrides?: Record<string, unknown>,
): FhirResource {
  return {
    resourceType: 'ProjectMembership',
    project: { reference: projectRef },
    user: { reference: userRef },
    userName: `member-${RUN_ID}`,
    ...overrides,
  };
}

function makeLogin(
  userRef: string,
  overrides?: Record<string, unknown>,
): FhirResource {
  return {
    resourceType: 'Login',
    user: { reference: userRef },
    authMethod: 'password',
    code: randomUUID(),
    granted: true,
    ...overrides,
  };
}

function makeClientApplication(overrides?: Record<string, unknown>): FhirResource {
  return {
    resourceType: 'ClientApplication',
    name: `TestClient-${RUN_ID}`,
    status: 'active',
    redirectUri: 'https://example.com/callback',
    secret: 'test-secret-123',
    ...overrides,
  };
}

function makeAccessPolicy(overrides?: Record<string, unknown>): FhirResource {
  return {
    resourceType: 'AccessPolicy',
    name: `TestPolicy-${RUN_ID}`,
    resource: [{ resourceType: 'Patient' }],
    ...overrides,
  };
}

function makeJsonWebKey(overrides?: Record<string, unknown>): FhirResource {
  return {
    resourceType: 'JsonWebKey',
    active: true,
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...\n-----END PUBLIC KEY-----',
    ...overrides,
  };
}

const ctxA: OperationContext = { project: PROJECT_A };
const ctxB: OperationContext = { project: PROJECT_B };
const ctxSuper: OperationContext = { project: PROJECT_A, superAdmin: true };

// =============================================================================
// Section 1: G1.1 — Platform Resource CRUD (7 types × 4 ops)
// =============================================================================

describe('G1.1: Platform Resource CRUD', () => {
  // --- Project ---
  describe('Project', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeProject());
      track('Project', created.id);
      expect(created.id).toBeTruthy();
      expect(created.meta.versionId).toBeTruthy();
      expect(created.meta.lastUpdated).toBeTruthy();
      expect(created.resourceType).toBe('Project');
    });

    it('read → returns same content', async () => {
      const created = await repo.createResource(makeProject({ name: `ReadProject-${RUN_ID}` }));
      track('Project', created.id);
      const read = await repo.readResource('Project', created.id);
      expect(read.id).toBe(created.id);
      expect((read as any).name).toBe(`ReadProject-${RUN_ID}`);
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeProject());
      track('Project', created.id);
      const updated = await repo.updateResource({ ...created, name: `Updated-${RUN_ID}` });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).name).toBe(`Updated-${RUN_ID}`);
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeProject());
      track('Project', created.id);
      await repo.deleteResource('Project', created.id);
      await expect(repo.readResource('Project', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- User ---
  describe('User', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeUser());
      track('User', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('User');
    });

    it('read → returns same content', async () => {
      const email = `read-${RUN_ID}@medxai.test`;
      const created = await repo.createResource(makeUser({ email }));
      track('User', created.id);
      const read = await repo.readResource('User', created.id);
      expect((read as any).email).toBe(email);
      expect((read as any).firstName).toBe('Test');
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeUser());
      track('User', created.id);
      const updated = await repo.updateResource({ ...created, firstName: 'Updated' });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).firstName).toBe('Updated');
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeUser());
      track('User', created.id);
      await repo.deleteResource('User', created.id);
      await expect(repo.readResource('User', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- ProjectMembership ---
  describe('ProjectMembership', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(
        makeProjectMembership(`Project/${randomUUID()}`, `User/${randomUUID()}`),
      );
      track('ProjectMembership', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('ProjectMembership');
    });

    it('read → returns same content', async () => {
      const projRef = `Project/${randomUUID()}`;
      const created = await repo.createResource(
        makeProjectMembership(projRef, `User/${randomUUID()}`),
      );
      track('ProjectMembership', created.id);
      const read = await repo.readResource('ProjectMembership', created.id);
      expect((read as any).project.reference).toBe(projRef);
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(
        makeProjectMembership(`Project/${randomUUID()}`, `User/${randomUUID()}`),
      );
      track('ProjectMembership', created.id);
      const updated = await repo.updateResource({ ...created, userName: `updated-${RUN_ID}` });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(
        makeProjectMembership(`Project/${randomUUID()}`, `User/${randomUUID()}`),
      );
      track('ProjectMembership', created.id);
      await repo.deleteResource('ProjectMembership', created.id);
      await expect(repo.readResource('ProjectMembership', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- Login ---
  describe('Login', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeLogin(`User/${randomUUID()}`));
      track('Login', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('Login');
    });

    it('read → returns same content', async () => {
      const code = randomUUID();
      const created = await repo.createResource(makeLogin(`User/${randomUUID()}`, { code }));
      track('Login', created.id);
      const read = await repo.readResource('Login', created.id);
      expect((read as any).code).toBe(code);
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeLogin(`User/${randomUUID()}`));
      track('Login', created.id);
      const updated = await repo.updateResource({ ...created, granted: false });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeLogin(`User/${randomUUID()}`));
      track('Login', created.id);
      await repo.deleteResource('Login', created.id);
      await expect(repo.readResource('Login', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- ClientApplication ---
  describe('ClientApplication', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeClientApplication());
      track('ClientApplication', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('ClientApplication');
    });

    it('read → returns same content', async () => {
      const name = `ReadClient-${RUN_ID}`;
      const created = await repo.createResource(makeClientApplication({ name }));
      track('ClientApplication', created.id);
      const read = await repo.readResource('ClientApplication', created.id);
      expect((read as any).name).toBe(name);
      expect((read as any).redirectUri).toBe('https://example.com/callback');
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeClientApplication());
      track('ClientApplication', created.id);
      const updated = await repo.updateResource({ ...created, status: 'off' });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).status).toBe('off');
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeClientApplication());
      track('ClientApplication', created.id);
      await repo.deleteResource('ClientApplication', created.id);
      await expect(repo.readResource('ClientApplication', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- AccessPolicy ---
  describe('AccessPolicy', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeAccessPolicy());
      track('AccessPolicy', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('AccessPolicy');
    });

    it('read → returns same content', async () => {
      const name = `ReadPolicy-${RUN_ID}`;
      const created = await repo.createResource(makeAccessPolicy({ name }));
      track('AccessPolicy', created.id);
      const read = await repo.readResource('AccessPolicy', created.id);
      expect((read as any).name).toBe(name);
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeAccessPolicy());
      track('AccessPolicy', created.id);
      const updated = await repo.updateResource({
        ...created,
        resource: [{ resourceType: 'Observation' }],
      });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeAccessPolicy());
      track('AccessPolicy', created.id);
      await repo.deleteResource('AccessPolicy', created.id);
      await expect(repo.readResource('AccessPolicy', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });

  // --- JsonWebKey ---
  describe('JsonWebKey', () => {
    it('create → returns id + meta', async () => {
      const created = await repo.createResource(makeJsonWebKey());
      track('JsonWebKey', created.id);
      expect(created.id).toBeTruthy();
      expect(created.resourceType).toBe('JsonWebKey');
    });

    it('read → returns same content', async () => {
      const created = await repo.createResource(makeJsonWebKey({ active: false }));
      track('JsonWebKey', created.id);
      const read = await repo.readResource('JsonWebKey', created.id);
      expect((read as any).active).toBe(false);
    });

    it('update → new versionId', async () => {
      const created = await repo.createResource(makeJsonWebKey());
      track('JsonWebKey', created.id);
      const updated = await repo.updateResource({ ...created, active: false });
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).active).toBe(false);
    });

    it('delete → gone', async () => {
      const created = await repo.createResource(makeJsonWebKey());
      track('JsonWebKey', created.id);
      await repo.deleteResource('JsonWebKey', created.id);
      await expect(repo.readResource('JsonWebKey', created.id)).rejects.toThrow(ResourceGoneError);
    });
  });
});

// =============================================================================
// Section 2: G1.2 — Search Column Physical Value Verification
// =============================================================================

describe('G1.2: Search Column Physical Values', () => {
  it('Project.name → __nameSort TEXT column populated', async () => {
    const name = `SearchProject-${RUN_ID}`;
    const created = await repo.createResource(makeProject({ name }));
    track('Project', created.id);

    const result = await db.query<{ __nameSort: string }>(
      `SELECT "__nameSort" FROM "Project" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].__nameSort).toBe(name);
  });

  it('Project.owner → reference column populated as TEXT', async () => {
    const ownerId = randomUUID();
    const created = await repo.createResource(
      makeProject({ owner: { reference: `User/${ownerId}` } }),
    );
    track('Project', created.id);

    const result = await db.query<{ owner: string }>(
      `SELECT "owner" FROM "Project" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].owner).toBe(`User/${ownerId}`);
  });

  it('User.email → email TEXT column populated', async () => {
    const email = `searchcol-${RUN_ID}@medxai.test`;
    const created = await repo.createResource(makeUser({ email }));
    track('User', created.id);

    const result = await db.query<{ email: string }>(
      `SELECT "email" FROM "User" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].email).toBe(email);
  });

  it('User.firstName → firstName TEXT column populated', async () => {
    const created = await repo.createResource(makeUser({ firstName: 'SearchFirst' }));
    track('User', created.id);

    const result = await db.query<{ firstName: string }>(
      `SELECT "firstName" FROM "User" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].firstName).toBe('SearchFirst');
  });

  it('User.project → reference column populated', async () => {
    const projId = randomUUID();
    const created = await repo.createResource(
      makeUser({ project: { reference: `Project/${projId}` } }),
    );
    track('User', created.id);

    const result = await db.query<{ project: string }>(
      `SELECT "project" FROM "User" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].project).toBe(`Project/${projId}`);
  });

  it('Login.code → code TEXT column populated', async () => {
    const code = `login-code-${RUN_ID}`;
    const created = await repo.createResource(makeLogin(`User/${randomUUID()}`, { code }));
    track('Login', created.id);

    const result = await db.query<{ code: string }>(
      `SELECT "code" FROM "Login" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].code).toBe(code);
  });

  it('Login.user → user reference TEXT column populated', async () => {
    const userId = randomUUID();
    const created = await repo.createResource(makeLogin(`User/${userId}`));
    track('Login', created.id);

    const result = await db.query<{ user: string }>(
      `SELECT "user" FROM "Login" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].user).toBe(`User/${userId}`);
  });

  it('ClientApplication.name → __nameSort TEXT column', async () => {
    const name = `SearchClient-${RUN_ID}`;
    const created = await repo.createResource(makeClientApplication({ name }));
    track('ClientApplication', created.id);

    const result = await db.query<{ __nameSort: string }>(
      `SELECT "__nameSort" FROM "ClientApplication" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].__nameSort).toBe(name);
  });

  it('ClientApplication.redirectUri → redirectUri TEXT column', async () => {
    const uri = 'https://test.example.com/auth/callback';
    const created = await repo.createResource(makeClientApplication({ redirectUri: uri }));
    track('ClientApplication', created.id);

    const result = await db.query<{ redirectUri: string }>(
      `SELECT "redirectUri" FROM "ClientApplication" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].redirectUri).toBe(uri);
  });

  it('ClientApplication.status → token column (UUID[] + TEXT[] + TEXT)', async () => {
    const created = await repo.createResource(makeClientApplication({ status: 'active' }));
    track('ClientApplication', created.id);

    const result = await db.query<{
      __status: string[];
      __statusText: string[];
      __statusSort: string;
    }>(
      `SELECT "__status", "__statusText", "__statusSort" FROM "ClientApplication" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    // Token columns should be populated
    expect(row.__status).toBeTruthy();
    expect(Array.isArray(row.__status)).toBe(true);
    expect(row.__status.length).toBeGreaterThan(0);
    expect(row.__statusText).toBeTruthy();
    expect(row.__statusSort).toBeTruthy();
  });

  it('AccessPolicy.name → __nameSort TEXT column', async () => {
    const name = `SearchPolicy-${RUN_ID}`;
    const created = await repo.createResource(makeAccessPolicy({ name }));
    track('AccessPolicy', created.id);

    const result = await db.query<{ __nameSort: string }>(
      `SELECT "__nameSort" FROM "AccessPolicy" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].__nameSort).toBe(name);
  });

  it('JsonWebKey.active → token column (UUID[] + TEXT[])', async () => {
    const created = await repo.createResource(makeJsonWebKey({ active: true }));
    track('JsonWebKey', created.id);

    const result = await db.query<{
      __active: string[];
      __activeText: string[];
      __activeSort: string;
    }>(
      `SELECT "__active", "__activeText", "__activeSort" FROM "JsonWebKey" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.__active).toBeTruthy();
    expect(Array.isArray(row.__active)).toBe(true);
  });
});

// =============================================================================
// Section 3: G1.3 — Reference Fields & Compartments
// =============================================================================

describe('G1.3: Reference Fields & Compartments', () => {
  it('ProjectMembership references populate _References table', async () => {
    const projId = randomUUID();
    const userId = randomUUID();
    const created = await repo.createResource(
      makeProjectMembership(`Project/${projId}`, `User/${userId}`),
    );
    track('ProjectMembership', created.id);

    const refs = await db.query<{ resourceId: string; targetId: string; code: string }>(
      `SELECT "resourceId", "targetId", "code" FROM "ProjectMembership_References" WHERE "resourceId" = $1`,
      [created.id],
    );
    // Should have reference rows for project and user
    expect(refs.rows.length).toBeGreaterThanOrEqual(2);
    const targetIds = refs.rows.map((r) => r.targetId);
    expect(targetIds).toContain(projId);
    expect(targetIds).toContain(userId);
  });

  it('Login references populate _References table', async () => {
    const userId = randomUUID();
    const clientId = randomUUID();
    const created = await repo.createResource(
      makeLogin(`User/${userId}`, { client: { reference: `ClientApplication/${clientId}` } }),
    );
    track('Login', created.id);

    const refs = await db.query<{ targetId: string; code: string }>(
      `SELECT "targetId", "code" FROM "Login_References" WHERE "resourceId" = $1`,
      [created.id],
    );
    const targetIds = refs.rows.map((r) => r.targetId);
    expect(targetIds).toContain(userId);
    expect(targetIds).toContain(clientId);
  });

  it('Project has empty compartments (no Patient reference)', async () => {
    const created = await repo.createResource(makeProject());
    track('Project', created.id);

    const result = await db.query<{ compartments: string[] }>(
      `SELECT "compartments" FROM "Project" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    // Platform resources typically have no Patient references → empty compartments
    expect(result.rows[0].compartments).toEqual([]);
  });

  it('projectId column populated correctly', async () => {
    const created = await repo.createResource(makeProject(), undefined, ctxA);
    track('Project', created.id);

    const result = await db.query<{ projectId: string }>(
      `SELECT "projectId" FROM "Project" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].projectId).toBe(PROJECT_A);
  });

  it('update preserves reference rows (delete old + insert new)', async () => {
    const userId1 = randomUUID();
    const userId2 = randomUUID();
    const created = await repo.createResource(makeLogin(`User/${userId1}`));
    track('Login', created.id);

    // Update to a different user reference
    await repo.updateResource({ ...created, user: { reference: `User/${userId2}` } });

    const refs = await db.query<{ targetId: string }>(
      `SELECT "targetId" FROM "Login_References" WHERE "resourceId" = $1`,
      [created.id],
    );
    const targetIds = refs.rows.map((r) => r.targetId);
    expect(targetIds).toContain(userId2);
    // Old reference should be removed
    expect(targetIds).not.toContain(userId1);
  });

  it('delete removes reference rows', async () => {
    const userId = randomUUID();
    const created = await repo.createResource(makeLogin(`User/${userId}`));
    track('Login', created.id);

    await repo.deleteResource('Login', created.id);

    const refs = await db.query<{ targetId: string }>(
      `SELECT "targetId" FROM "Login_References" WHERE "resourceId" = $1`,
      [created.id],
    );
    expect(refs.rows).toHaveLength(0);
  });
});

// =============================================================================
// Section 4: G1.4 — History Integrity
// =============================================================================

describe('G1.4: History Integrity', () => {
  it('create → 1 history entry', async () => {
    const created = await repo.createResource(makeClientApplication());
    track('ClientApplication', created.id);

    const result = await db.query<{ versionId: string }>(
      `SELECT "versionId" FROM "ClientApplication_History" WHERE "id" = $1`,
      [created.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].versionId).toBe(created.meta.versionId);
  });

  it('create → update → 2 history entries, correct order', async () => {
    const created = await repo.createResource(makeUser());
    track('User', created.id);
    const updated = await repo.updateResource({ ...created, firstName: 'V2' });

    const result = await db.query<{ versionId: string; lastUpdated: Date }>(
      `SELECT "versionId", "lastUpdated" FROM "User_History" WHERE "id" = $1 ORDER BY "lastUpdated" ASC`,
      [created.id],
    );
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].versionId).toBe(created.meta.versionId);
    expect(result.rows[1].versionId).toBe(updated.meta.versionId);
  });

  it('create → update → delete → 3 entries, delete marker empty', async () => {
    const created = await repo.createResource(makeAccessPolicy());
    track('AccessPolicy', created.id);
    await repo.updateResource({ ...created, name: `Updated-${RUN_ID}` });
    await repo.deleteResource('AccessPolicy', created.id);

    const result = await db.query<{ content: string; lastUpdated: Date }>(
      `SELECT "content", "lastUpdated" FROM "AccessPolicy_History" WHERE "id" = $1 ORDER BY "lastUpdated" ASC`,
      [created.id],
    );
    expect(result.rows).toHaveLength(3);
    // Last entry (delete) has empty content
    expect(result.rows[2].content).toBe('');
    // First two entries have valid JSON
    expect(result.rows[0].content.length).toBeGreaterThan(0);
    expect(result.rows[1].content.length).toBeGreaterThan(0);
  });

  it('readHistory returns correct entries via API', async () => {
    const created = await repo.createResource(makeProject());
    track('Project', created.id);
    const updated = await repo.updateResource({ ...created, name: `HistV2-${RUN_ID}` });

    const history = await repo.readHistory('Project', created.id);
    expect(history).toHaveLength(2);
    // History is returned newest first
    expect(history[0].versionId).toBe(updated.meta.versionId);
    expect(history[1].versionId).toBe(created.meta.versionId);
  });

  it('readVersion (vread) returns correct version', async () => {
    const created = await repo.createResource(makeUser());
    track('User', created.id);
    const updated = await repo.updateResource({ ...created, firstName: 'VreadV2' });

    // Read v1
    const v1 = await repo.readVersion('User', created.id, created.meta.versionId);
    expect((v1 as any).firstName).toBe('Test');

    // Read v2
    const v2 = await repo.readVersion('User', created.id, updated.meta.versionId);
    expect((v2 as any).firstName).toBe('VreadV2');
  });

  it('duplicate versionId in history → PK violation', async () => {
    const created = await repo.createResource(makeLogin(`User/${randomUUID()}`));
    track('Login', created.id);

    await expect(
      db.query(
        `INSERT INTO "Login_History" ("versionId", "id", "content", "lastUpdated") VALUES ($1, $2, $3, $4)`,
        [created.meta.versionId, created.id, '{}', new Date().toISOString()],
      ),
    ).rejects.toThrow();
  });
});

// =============================================================================
// Section 5: G1.5 — Cross-Project Isolation
// =============================================================================

describe('G1.5: Cross-Project Isolation', () => {
  it('Project A create → Project B read → NotFound', async () => {
    const created = await repo.createResource(makeUser(), undefined, ctxA);
    track('User', created.id);

    await expect(
      repo.readResource('User', created.id, ctxB),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('Project A create → Project A read → success', async () => {
    const created = await repo.createResource(makeUser(), undefined, ctxA);
    track('User', created.id);

    const read = await repo.readResource('User', created.id, ctxA);
    expect(read.id).toBe(created.id);
  });

  it('superAdmin bypasses project isolation', async () => {
    const created = await repo.createResource(makeUser(), undefined, ctxA);
    track('User', created.id);

    // superAdmin with a different project can still read
    const superCtx: OperationContext = { project: PROJECT_B, superAdmin: true };
    const read = await repo.readResource('User', created.id, superCtx);
    expect(read.id).toBe(created.id);
  });

  it('Project A update → Project B update same resource → NotFound', async () => {
    const created = await repo.createResource(
      makeClientApplication(),
      undefined,
      ctxA,
    );
    track('ClientApplication', created.id);

    // Project A can update
    await repo.updateResource({ ...created, name: 'UpdatedByA' }, undefined, ctxA);

    // Project B cannot update
    await expect(
      repo.updateResource({ ...created, name: 'UpdatedByB' }, undefined, ctxB),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('Project A delete → Project B delete same resource → NotFound', async () => {
    const created = await repo.createResource(
      makeAccessPolicy(),
      undefined,
      ctxA,
    );
    track('AccessPolicy', created.id);

    // Project B cannot delete
    await expect(
      repo.deleteResource('AccessPolicy', created.id, ctxB),
    ).rejects.toThrow(ResourceNotFoundError);

    // Project A can delete
    await repo.deleteResource('AccessPolicy', created.id, ctxA);
  });

  it('searchResources auto-injects project filter', async () => {
    // Create users in both projects with distinct emails
    const emailA = `projA-${RUN_ID}@medxai.test`;
    const emailB = `projB-${RUN_ID}@medxai.test`;

    const userA = await repo.createResource(makeUser({ email: emailA }), undefined, ctxA);
    track('User', userA.id);
    const userB = await repo.createResource(makeUser({ email: emailB }), undefined, ctxB);
    track('User', userB.id);

    // Search with Project A context → only finds userA
    const resultA = await repo.searchResources(
      { resourceType: 'User', params: [] },
      undefined,
      ctxA,
    );
    const idsA = resultA.resources.map((r) => r.id);
    expect(idsA).toContain(userA.id);
    expect(idsA).not.toContain(userB.id);

    // Search with Project B context → only finds userB
    const resultB = await repo.searchResources(
      { resourceType: 'User', params: [] },
      undefined,
      ctxB,
    );
    const idsB = resultB.resources.map((r) => r.id);
    expect(idsB).toContain(userB.id);
    expect(idsB).not.toContain(userA.id);
  });
});

// =============================================================================
// Section 6: G1.6 — Concurrent Safety (FOR UPDATE)
// =============================================================================

describe('G1.6: Concurrent Safety', () => {
  it('concurrent ifMatch updates: one succeeds, one gets conflict', async () => {
    const created = await repo.createResource(makeClientApplication());
    track('ClientApplication', created.id);
    const vid = created.meta.versionId;

    const update1 = repo.updateResource(
      { ...created, name: 'Concurrent1' },
      { ifMatch: vid },
    );
    const update2 = repo.updateResource(
      { ...created, name: 'Concurrent2' },
      { ifMatch: vid },
    );

    const results = await Promise.allSettled([update1, update2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ResourceVersionConflictError,
    );
  }, 15_000);

  it('concurrent delete + update: one succeeds, other gets error', async () => {
    const created = await repo.createResource(makeJsonWebKey());
    track('JsonWebKey', created.id);

    const del = repo.deleteResource('JsonWebKey', created.id);
    const upd = repo.updateResource({ ...created, active: false });

    const results = await Promise.allSettled([del, upd]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');

    // At least one succeeds, no data corruption
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // DB state is consistent
    const mainResult = await db.query<{ deleted: boolean }>(
      `SELECT "deleted" FROM "JsonWebKey" WHERE "id" = $1`,
      [created.id],
    );
    expect(mainResult.rows).toHaveLength(1);
  }, 15_000);

  it('concurrent updates without ifMatch: last-write-wins', async () => {
    const created = await repo.createResource(makeLogin(`User/${randomUUID()}`));
    track('Login', created.id);

    const update1 = repo.updateResource({ ...created, granted: false });
    const update2 = repo.updateResource({ ...created, granted: true });

    const results = await Promise.allSettled([update1, update2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');

    // Both should succeed (no ifMatch → no conflict check)
    expect(fulfilled).toHaveLength(2);

    // History should have 3 entries (create + 2 updates)
    const history = await db.query<{ versionId: string }>(
      `SELECT "versionId" FROM "Login_History" WHERE "id" = $1`,
      [created.id],
    );
    expect(history.rows).toHaveLength(3);
  }, 15_000);

  it('FOR UPDATE lock prevents TOCTOU on platform resource', async () => {
    const created = await repo.createResource(makeProject());
    track('Project', created.id);
    const vid = created.meta.versionId;

    // Two sequential updates with same ifMatch — second must fail
    await repo.updateResource(
      { ...created, name: 'Sequential1' },
      { ifMatch: vid },
    );

    await expect(
      repo.updateResource(
        { ...created, name: 'Sequential2' },
        { ifMatch: vid },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);
  });
});
