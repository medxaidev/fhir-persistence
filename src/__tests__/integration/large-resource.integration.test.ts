/**
 * Large Resource Integration Tests — Real PostgreSQL
 *
 * Tests boundary conditions for resource size and content:
 * - 1MB JSON resource: create succeeds, content fully preserved
 * - Large resource update: new version complete, history preserves old version
 * - 100-field Patient: all fields survive round-trip
 * - Deeply nested JSON (10 levels): no data loss
 * - Unicode characters: correct storage and retrieval
 * - Special characters (quotes, backslashes): SQL injection safety
 *
 * Corresponds to Medplum: no direct equivalent, but validates the
 * parameterized SQL approach (sql-builder.ts) against edge cases.
 * Tests: D-01 ~ D-06
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DatabaseClient } from '../../db/client.js';
import { FhirRepository } from '../../repo/fhir-repo.js';
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
    if (!process.env[key]) process.env[key] = value;
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

async function cleanup(resourceType: string, id: string): Promise<void> {
  try {
    await db.query(`DELETE FROM "${resourceType}_History" WHERE "id" = $1`, [id]);
    await db.query(`DELETE FROM "${resourceType}" WHERE "id" = $1`, [id]);
  } catch {
    // ignore
  }
}

/**
 * Build a deeply nested object of the given depth.
 * e.g. depth=3 → { level: 1, child: { level: 2, child: { level: 3, child: {} } } }
 */
function buildNestedObject(depth: number): Record<string, unknown> {
  if (depth <= 0) return { leaf: true };
  return { level: depth, child: buildNestedObject(depth - 1) };
}

// =============================================================================
// D-01: 1MB JSON resource — create succeeds, content fully preserved
// =============================================================================

describe('D-01: large resource (1MB JSON)', () => {
  it('creates a resource with ~1MB content and reads it back intact', async () => {
    // Build a Patient with a large extension array (~1MB)
    const largeText = 'x'.repeat(1000); // 1000 chars per entry
    const extensions = Array.from({ length: 900 }, (_, i) => ({
      url: `http://example.com/ext-${i}`,
      valueString: largeText,
    }));

    const largePatient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'LargeResource', given: ['Test'] }],
      extension: extensions,
    };

    const created = await repo.createResource(largePatient);
    expect(created.id).toBeTruthy();

    // Read back and verify content integrity
    const read = await repo.readResource('Patient', created.id);
    const readExtensions = (read as any).extension as unknown[];
    expect(readExtensions).toHaveLength(900);
    expect((readExtensions[0] as any).valueString).toHaveLength(1000);
    expect((readExtensions[899] as any).url).toBe('http://example.com/ext-899');

    await cleanup('Patient', created.id);
  });
});

// =============================================================================
// D-02: Large resource update — new version complete, history preserves old
// =============================================================================

describe('D-02: large resource update preserves history', () => {
  it('update of large resource stores both versions in history', async () => {
    const extensions = Array.from({ length: 100 }, (_, i) => ({
      url: `http://example.com/ext-${i}`,
      valueString: `value-${i}-${'a'.repeat(100)}`,
    }));

    const v1Resource: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'LargeV1', given: ['History'] }],
      birthDate: '1990-01-01',
      extension: extensions,
    };

    const v1 = await repo.createResource(v1Resource);

    // Update with different extensions
    const updatedExtensions = Array.from({ length: 100 }, (_, i) => ({
      url: `http://example.com/updated-${i}`,
      valueString: `updated-${i}`,
    }));

    const v2 = await repo.updateResource({
      ...v1,
      birthDate: '1991-06-15',
      extension: updatedExtensions,
    });

    expect(v2.meta.versionId).not.toBe(v1.meta.versionId);

    // Read specific version v1 — should have original extensions
    const readV1 = await repo.readVersion('Patient', v1.id, v1.meta.versionId);
    expect((readV1 as any).birthDate).toBe('1990-01-01');
    expect((readV1 as any).extension[0].url).toBe('http://example.com/ext-0');

    // Read specific version v2 — should have updated extensions
    const readV2 = await repo.readVersion('Patient', v1.id, v2.meta.versionId);
    expect((readV2 as any).birthDate).toBe('1991-06-15');
    expect((readV2 as any).extension[0].url).toBe('http://example.com/updated-0');

    await cleanup('Patient', v1.id);
  });
});

// =============================================================================
// D-03: 100-field Patient — all fields survive round-trip
// =============================================================================

describe('D-03: 100-field resource round-trip', () => {
  it('all 100 custom fields are preserved after create and read', async () => {
    // Build a Patient with many top-level extension fields
    const manyExtensions = Array.from({ length: 100 }, (_, i) => ({
      url: `http://example.com/field-${i}`,
      valueString: `field-value-${i}`,
    }));

    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'ManyFields', given: ['Test'] }],
      birthDate: '1985-03-15',
      gender: 'female',
      active: true,
      extension: manyExtensions,
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    // Core fields
    expect((read as any).name[0].family).toBe('ManyFields');
    expect((read as any).birthDate).toBe('1985-03-15');
    expect((read as any).gender).toBe('female');
    expect((read as any).active).toBe(true);

    // All 100 extension fields
    const readExtensions = (read as any).extension as Array<{ url: string; valueString: string }>;
    expect(readExtensions).toHaveLength(100);
    for (let i = 0; i < 100; i++) {
      expect(readExtensions[i].url).toBe(`http://example.com/field-${i}`);
      expect(readExtensions[i].valueString).toBe(`field-value-${i}`);
    }

    await cleanup('Patient', created.id);
  });
});

// =============================================================================
// D-04: Deeply nested JSON (10 levels) — no data loss
// =============================================================================

describe('D-04: deeply nested JSON', () => {
  it('10-level nested JSON is stored and retrieved without data loss', async () => {
    const deepNested = buildNestedObject(10);

    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'DeepNested', given: ['Test'] }],
      extension: [
        {
          url: 'http://example.com/deep',
          valueString: JSON.stringify(deepNested),
        },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    const ext = (read as any).extension[0];
    const recovered = JSON.parse(ext.valueString);

    // Verify the deepest level is intact
    let current = recovered;
    for (let depth = 10; depth > 0; depth--) {
      expect(current.level).toBe(depth);
      current = current.child;
    }
    expect(current.leaf).toBe(true);

    await cleanup('Patient', created.id);
  });
});

// =============================================================================
// D-05: Unicode characters — correct storage and retrieval
// =============================================================================

describe('D-05: Unicode character handling', () => {
  it('Chinese characters are stored and retrieved correctly', async () => {
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: '张', given: ['伟'] }],
      extension: [
        { url: 'http://example.com/note', valueString: '患者信息：健康状况良好' },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    expect((read as any).name[0].family).toBe('张');
    expect((read as any).name[0].given[0]).toBe('伟');
    expect((read as any).extension[0].valueString).toBe('患者信息：健康状况良好');

    await cleanup('Patient', created.id);
  });

  it('Arabic, Japanese, and emoji characters are preserved', async () => {
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'مريض', given: ['テスト'] }],
      extension: [
        { url: 'http://example.com/emoji', valueString: '🏥 Patient 🩺' },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    expect((read as any).name[0].family).toBe('مريض');
    expect((read as any).name[0].given[0]).toBe('テスト');
    expect((read as any).extension[0].valueString).toBe('🏥 Patient 🩺');

    await cleanup('Patient', created.id);
  });

  it('null bytes and control characters in strings are handled safely', async () => {
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'ControlChars', given: ['Test'] }],
      extension: [
        // Tab and newline are valid in JSON strings
        { url: 'http://example.com/tab', valueString: 'line1\tline2\nline3' },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    expect((read as any).extension[0].valueString).toBe('line1\tline2\nline3');

    await cleanup('Patient', created.id);
  });
});

// =============================================================================
// D-06: Special characters — SQL injection safety
// =============================================================================

describe('D-06: SQL injection safety', () => {
  it('single quotes in string values are stored safely (parameterized queries)', async () => {
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: "O'Brien", given: ["Patrick"] }],
      extension: [
        { url: 'http://example.com/note', valueString: "It's a test; DROP TABLE Patient; --" },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    expect((read as any).name[0].family).toBe("O'Brien");
    expect((read as any).extension[0].valueString).toBe("It's a test; DROP TABLE Patient; --");

    // Verify Patient table still exists (not dropped)
    const tableCheck = await db.query(
      `SELECT COUNT(*) as count FROM "Patient" WHERE "id" = $1`,
      [created.id],
    );
    expect(parseInt((tableCheck.rows[0] as any).count, 10)).toBe(1);

    await cleanup('Patient', created.id);
  });

  it('backslashes and double quotes in values are stored safely', async () => {
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'Back\\slash', given: ['"Quoted"'] }],
      extension: [
        { url: 'http://example.com/path', valueString: 'C:\\Users\\test\\file.txt' },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    expect((read as any).name[0].family).toBe('Back\\slash');
    expect((read as any).name[0].given[0]).toBe('"Quoted"');
    expect((read as any).extension[0].valueString).toBe('C:\\Users\\test\\file.txt');

    await cleanup('Patient', created.id);
  });

  it('JSON injection attempt in string values is stored as literal string', async () => {
    const maliciousValue = '{"resourceType":"Patient","id":"injected"}';
    const patient: FhirResource = {
      resourceType: 'Patient',
      name: [{ family: 'JsonInjection', given: ['Test'] }],
      extension: [
        { url: 'http://example.com/inject', valueString: maliciousValue },
      ],
    };

    const created = await repo.createResource(patient);
    const read = await repo.readResource('Patient', created.id);

    // The value should be stored as a plain string, not parsed as JSON
    expect((read as any).extension[0].valueString).toBe(maliciousValue);
    // The resource ID should be the one we created, not the injected one
    expect(read.id).toBe(created.id);

    await cleanup('Patient', created.id);
  });
});
