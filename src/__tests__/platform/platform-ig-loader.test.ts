/**
 * Platform IG Loader Tests â€?12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { buildPlatformTableSets, initializePlatformIG } from '../../platform/platform-ig-loader.js';
import { getPackageChecksum } from '../../platform/platform-ig-definitions.js';
import { PackageRegistryRepo } from '../../registry/package-registry-repo.js';

describe('buildPlatformTableSets', () => {
  // =========================================================================
  // 1. returns 5 ResourceTableSets
  // =========================================================================
  it('returns 5 ResourceTableSets', () => {
    const tableSets = buildPlatformTableSets();
    expect(tableSets).toHaveLength(5);
    const types = tableSets.map(ts => ts.resourceType).sort();
    expect(types).toEqual(['Agent', 'Bot', 'ClientApplication', 'Project', 'User']);
  });

  // =========================================================================
  // 2. each ResourceTableSet has main/history/references tables
  // =========================================================================
  it('each ResourceTableSet has main, history, references', () => {
    const tableSets = buildPlatformTableSets();
    for (const ts of tableSets) {
      expect(ts.main).toBeDefined();
      expect(ts.main.tableName).toBe(ts.resourceType);
      expect(ts.history).toBeDefined();
      expect(ts.history.tableName).toBe(`${ts.resourceType}_History`);
      expect(ts.references).toBeDefined();
      expect(ts.references.tableName).toBe(`${ts.resourceType}_References`);
    }
  });

  // =========================================================================
  // 3. User table has email/name/active search columns
  // =========================================================================
  it('User table has search columns for user-email, display-name, active', () => {
    const tableSets = buildPlatformTableSets();
    const user = tableSets.find(ts => ts.resourceType === 'User')!;
    const colNames = user.main.columns.map(c => c.name);
    // 'display-name' is a string column â†?camelCase 'displayName'
    expect(colNames).toContain('displayName');
    // 'user-email' is a token â†?__userEmail and __userEmailSort
    expect(colNames).toContain('__userEmail');
    expect(colNames).toContain('__userEmailSort');
    // 'active' is a token â†?__active and __activeSort
    expect(colNames).toContain('__active');
    expect(colNames).toContain('__activeSort');
  });

  // =========================================================================
  // 4. Bot table has search columns for its SPs
  // =========================================================================
  it('Bot table has search columns for display-name, identifier, status', () => {
    const tableSets = buildPlatformTableSets();
    const bot = tableSets.find(ts => ts.resourceType === 'Bot')!;
    const colNames = bot.main.columns.map(c => c.name);
    expect(colNames).toContain('displayName');
    expect(colNames).toContain('__identifier');
    expect(colNames).toContain('__status');
  });

  // =========================================================================
  // 5. User table has correct fixed columns
  // =========================================================================
  it('User table has fixed columns: id, content, lastUpdated, deleted', () => {
    const tableSets = buildPlatformTableSets();
    const user = tableSets.find(ts => ts.resourceType === 'User')!;
    const colNames = user.main.columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('content');
    expect(colNames).toContain('lastUpdated');
    expect(colNames).toContain('deleted');
    expect(colNames).toContain('versionId');
  });

  // =========================================================================
  // 6. searchParams metadata preserved in ResourceTableSet
  // =========================================================================
  it('searchParams metadata preserved for SchemaDiff', () => {
    const tableSets = buildPlatformTableSets();
    const user = tableSets.find(ts => ts.resourceType === 'User')!;
    expect(user.searchParams).toBeDefined();
    expect(user.searchParams!.length).toBeGreaterThan(0);
    const codes = user.searchParams!.map(sp => sp.code).sort();
    expect(codes).toContain('user-email');
    expect(codes).toContain('display-name');
    expect(codes).toContain('active');
  });
});

describe('initializePlatformIG (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 7. initializePlatformIG with empty DB creates tables
  // =========================================================================
  it('creates platform tables on fresh DB', async () => {
    const result = await initializePlatformIG(adapter);
    expect(result.error).toBeUndefined();
    expect(result.ddlCount).toBeGreaterThan(0);

    // Verify User table exists
    const rows = await adapter.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'",
    );
    expect(rows).toHaveLength(1);
  });

  // =========================================================================
  // 8. returns action=new on fresh DB
  // =========================================================================
  it('returns action=new on fresh DB', async () => {
    const result = await initializePlatformIG(adapter);
    expect(result.action).toBe('new');
    expect(result.packageName).toBe('medxai.core');
    expect(result.packageVersion).toBe('1.0.0');
  });

  // =========================================================================
  // 9. returns action=consistent on re-run
  // =========================================================================
  it('returns action=consistent on second run', async () => {
    await initializePlatformIG(adapter);
    const result2 = await initializePlatformIG(adapter);
    expect(result2.action).toBe('consistent');
    expect(result2.ddlCount).toBe(0);
  });

  // =========================================================================
  // 10. stores schema snapshot in package registry
  // =========================================================================
  it('stores schema snapshot in package registry', async () => {
    await initializePlatformIG(adapter);
    const repo = new PackageRegistryRepo(adapter);
    const pkg = await repo.getPackage('medxai.core');
    expect(pkg).toBeDefined();
    expect(pkg!.version).toBe('1.0.0');
    expect(pkg!.schemaSnapshot).toBeTruthy();
    const snapshot = JSON.parse(pkg!.schemaSnapshot!);
    expect(snapshot).toHaveLength(5);
  });

  // =========================================================================
  // 11. platform tables are queryable after init
  // =========================================================================
  it('platform tables are queryable after init', async () => {
    await initializePlatformIG(adapter);

    // All 5 resource types should have tables
    for (const type of ['User', 'Bot', 'Project', 'Agent', 'ClientApplication']) {
      const rows = await adapter.query(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [type],
      );
      expect(rows).toHaveLength(1);

      // History table too
      const histRows = await adapter.query(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [`${type}_History`],
      );
      expect(histRows).toHaveLength(1);

      // References table
      const refRows = await adapter.query(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [`${type}_References`],
      );
      expect(refRows).toHaveLength(1);
    }
  });

  // =========================================================================
  // 12. getPackageChecksum is deterministic across calls
  // =========================================================================
  it('getPackageChecksum is deterministic across calls', () => {
    const c1 = getPackageChecksum();
    const c2 = getPackageChecksum();
    const c3 = getPackageChecksum();
    expect(c1).toBe(c2);
    expect(c2).toBe(c3);
  });
});
