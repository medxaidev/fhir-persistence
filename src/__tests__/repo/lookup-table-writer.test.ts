/**
 * LookupTableWriter v2 Tests
 *
 * Verifies DDL creation, row insertion (replace strategy), and deletion
 * for the 4 global lookup tables.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { LookupTableWriter } from '../../repo/lookup-table-writer.js';
import type { LookupTableRow } from '../../repo/row-indexer.js';

describe('LookupTableWriter v2', () => {
  let adapter: BetterSqlite3Adapter;
  let writer: LookupTableWriter;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    writer = new LookupTableWriter(adapter);
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // DDL
  // ---------------------------------------------------------------------------

  it('ensureTables creates all 4 lookup tables', async () => {
    await writer.ensureTables();
    for (const table of ['HumanName', 'Address', 'ContactPoint', 'Identifier']) {
      const row = await adapter.queryOne<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table],
      );
      expect(row).toBeDefined();
      expect(row!.name).toBe(table);
    }
  });

  it('ensureTables creates indexes', async () => {
    const indexes = await adapter.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%_idx'`,
    );
    const names = indexes.map(i => i.name);
    expect(names).toContain('HumanName_resourceId_idx');
    expect(names).toContain('HumanName_name_idx');
    expect(names).toContain('Address_resourceId_idx');
    expect(names).toContain('ContactPoint_resourceId_idx');
    expect(names).toContain('Identifier_resourceId_idx');
    expect(names).toContain('Identifier_system_value_idx');
  });

  it('ensureTables is idempotent', async () => {
    await writer.ensureTables();
    await writer.ensureTables();
    // No error
  });

  // ---------------------------------------------------------------------------
  // HumanName
  // ---------------------------------------------------------------------------

  it('writes HumanName rows', async () => {
    const rows: LookupTableRow[] = [
      {
        table: 'HumanName',
        values: { resourceId: 'pat-1', name: 'Smith John', given: 'John', family: 'Smith' },
      },
      {
        table: 'HumanName',
        values: { resourceId: 'pat-1', name: 'Doe Jane', given: 'Jane', family: 'Doe' },
      },
    ];
    await writer.writeRows('pat-1', rows);

    const result = await writer.getRows<{ resourceId: string; name: string; family: string }>(
      'HumanName', 'pat-1',
    );
    expect(result.length).toBe(2);
    expect(result[0].family).toBe('Smith');
    expect(result[1].family).toBe('Doe');
  });

  it('replace strategy deletes old HumanName rows on re-write', async () => {
    // Overwrite with single row
    const rows: LookupTableRow[] = [
      {
        table: 'HumanName',
        values: { resourceId: 'pat-1', name: 'NewName', given: 'New', family: 'Name' },
      },
    ];
    await writer.writeRows('pat-1', rows);

    const result = await writer.getRows('HumanName', 'pat-1');
    expect(result.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Address
  // ---------------------------------------------------------------------------

  it('writes Address rows', async () => {
    const rows: LookupTableRow[] = [
      {
        table: 'Address',
        values: {
          resourceId: 'pat-2',
          address: '123 Main St Boston MA 02101 US',
          city: 'Boston',
          country: 'US',
          postalCode: '02101',
          state: 'MA',
          use: 'home',
        },
      },
    ];
    await writer.writeRows('pat-2', rows);

    const result = await writer.getRows<{ city: string; state: string }>(
      'Address', 'pat-2',
    );
    expect(result.length).toBe(1);
    expect(result[0].city).toBe('Boston');
    expect(result[0].state).toBe('MA');
  });

  // ---------------------------------------------------------------------------
  // ContactPoint
  // ---------------------------------------------------------------------------

  it('writes ContactPoint rows', async () => {
    const rows: LookupTableRow[] = [
      {
        table: 'ContactPoint',
        values: { resourceId: 'pat-3', system: 'phone', value: '+1-555-0100', use: 'home' },
      },
      {
        table: 'ContactPoint',
        values: { resourceId: 'pat-3', system: 'email', value: 'test@example.com', use: 'work' },
      },
    ];
    await writer.writeRows('pat-3', rows);

    const result = await writer.getRows<{ system: string; value: string }>(
      'ContactPoint', 'pat-3',
    );
    expect(result.length).toBe(2);
    expect(result.some(r => r.system === 'email')).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Identifier
  // ---------------------------------------------------------------------------

  it('writes Identifier rows', async () => {
    const rows: LookupTableRow[] = [
      {
        table: 'Identifier',
        values: { resourceId: 'pat-4', system: 'http://example.org/mrn', value: 'MRN-001' },
      },
    ];
    await writer.writeRows('pat-4', rows);

    const result = await writer.getRows<{ system: string; value: string }>(
      'Identifier', 'pat-4',
    );
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('MRN-001');
  });

  // ---------------------------------------------------------------------------
  // Mixed tables
  // ---------------------------------------------------------------------------

  it('writes rows across multiple tables in one call', async () => {
    const rows: LookupTableRow[] = [
      { table: 'HumanName', values: { resourceId: 'pat-5', name: 'Mix Test', given: 'Mix', family: 'Test' } },
      { table: 'Identifier', values: { resourceId: 'pat-5', system: 'http://id', value: 'V1' } },
      { table: 'ContactPoint', values: { resourceId: 'pat-5', system: 'email', value: 'mix@test.com', use: null } },
    ];
    await writer.writeRows('pat-5', rows);

    const names = await writer.getRows('HumanName', 'pat-5');
    const ids = await writer.getRows('Identifier', 'pat-5');
    const contacts = await writer.getRows('ContactPoint', 'pat-5');
    expect(names.length).toBe(1);
    expect(ids.length).toBe(1);
    expect(contacts.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  it('deleteRows removes all lookup data for a resource', async () => {
    await writer.deleteRows('pat-5');
    const names = await writer.getRows('HumanName', 'pat-5');
    const ids = await writer.getRows('Identifier', 'pat-5');
    const contacts = await writer.getRows('ContactPoint', 'pat-5');
    expect(names.length).toBe(0);
    expect(ids.length).toBe(0);
    expect(contacts.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('writeRows with empty array does nothing', async () => {
    await writer.writeRows('pat-6', []);
    // No error, no rows
    const names = await writer.getRows('HumanName', 'pat-6');
    expect(names.length).toBe(0);
  });

  it('writeRows handles null values in columns', async () => {
    const rows: LookupTableRow[] = [
      { table: 'HumanName', values: { resourceId: 'pat-7', name: null, given: null, family: null } },
    ];
    await writer.writeRows('pat-7', rows);
    const result = await writer.getRows<{ resourceId: string; name: string | null }>(
      'HumanName', 'pat-7',
    );
    expect(result.length).toBe(1);
    expect(result[0].name).toBeNull();
  });
});
