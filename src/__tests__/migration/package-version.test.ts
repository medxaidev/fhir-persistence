/**
 * B5: Package Version Management Tests
 *
 * Verifies multi-version lifecycle for fhir_packages:
 * - registerPackage supersedes old versions
 * - getActivePackages returns only active
 * - schema_version records package_list snapshots
 *
 * ADR-04, ADR-13
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageRegistryRepo } from '../../registry/package-registry-repo.js';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';

describe('B5: Package Version Management', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: PackageRegistryRepo;

  beforeEach(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    repo = new PackageRegistryRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // registerPackage supersede logic
  // ---------------------------------------------------------------------------

  describe('registerPackage supersede logic', () => {
    it('first registration creates active package', async () => {
      await repo.registerPackage({
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        checksum: 'sha256:aaa',
        schemaSnapshot: null,
      });

      const pkg = await repo.getPackage('hl7.fhir.r4.core');
      expect(pkg).toBeDefined();
      expect(pkg!.version).toBe('4.0.1');
      expect(pkg!.status).toBe('active');
    });

    it('second registration supersedes old version', async () => {
      await repo.registerPackage({
        name: 'hl7.fhir.r4.core',
        version: '4.0.1',
        checksum: 'sha256:aaa',
        schemaSnapshot: null,
      });

      await repo.registerPackage({
        name: 'hl7.fhir.r4.core',
        version: '4.0.2',
        checksum: 'sha256:bbb',
        schemaSnapshot: null,
      });

      // Active should be 4.0.2
      const active = await repo.getPackage('hl7.fhir.r4.core');
      expect(active).toBeDefined();
      expect(active!.version).toBe('4.0.2');
      expect(active!.status).toBe('active');

      // All packages should include both versions
      const all = await repo.getInstalledPackages();
      const r4 = all.filter(p => p.name === 'hl7.fhir.r4.core');
      expect(r4).toHaveLength(2);
      expect(r4.find(p => p.version === '4.0.1')!.status).toBe('superseded');
      expect(r4.find(p => p.version === '4.0.2')!.status).toBe('active');
    });

    it('three versions: only latest is active', async () => {
      for (const v of ['1.0.0', '1.1.0', '2.0.0']) {
        await repo.registerPackage({
          name: 'my.pkg',
          version: v,
          checksum: `sha256:${v}`,
          schemaSnapshot: null,
        });
      }

      const active = await repo.getActivePackages();
      const myPkg = active.filter(p => p.name === 'my.pkg');
      expect(myPkg).toHaveLength(1);
      expect(myPkg[0].version).toBe('2.0.0');

      const all = await repo.getInstalledPackages();
      const superseded = all.filter(p => p.name === 'my.pkg' && p.status === 'superseded');
      expect(superseded).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getActivePackages
  // ---------------------------------------------------------------------------

  describe('getActivePackages', () => {
    it('returns only active packages', async () => {
      await repo.registerPackage({
        name: 'pkg-a',
        version: '1.0.0',
        checksum: 'sha256:a1',
        schemaSnapshot: null,
      });
      await repo.registerPackage({
        name: 'pkg-b',
        version: '2.0.0',
        checksum: 'sha256:b1',
        schemaSnapshot: null,
      });
      // Upgrade pkg-a
      await repo.registerPackage({
        name: 'pkg-a',
        version: '1.1.0',
        checksum: 'sha256:a2',
        schemaSnapshot: null,
      });

      const active = await repo.getActivePackages();
      expect(active).toHaveLength(2);
      expect(active.find(p => p.name === 'pkg-a')!.version).toBe('1.1.0');
      expect(active.find(p => p.name === 'pkg-b')!.version).toBe('2.0.0');
    });

    it('returns empty when no packages installed', async () => {
      const active = await repo.getActivePackages();
      expect(active).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // upsertPackage backward compatibility
  // ---------------------------------------------------------------------------

  describe('upsertPackage backward compatibility', () => {
    it('upsertPackage supersedes old versions like registerPackage', async () => {
      await repo.upsertPackage({
        name: 'test.pkg',
        version: '1.0.0',
        checksum: 'sha256:v1',
        schemaSnapshot: null,
      });
      await repo.upsertPackage({
        name: 'test.pkg',
        version: '2.0.0',
        checksum: 'sha256:v2',
        schemaSnapshot: null,
      });

      const active = await repo.getPackage('test.pkg');
      expect(active!.version).toBe('2.0.0');
      expect(active!.status).toBe('active');
    });
  });

  // ---------------------------------------------------------------------------
  // checkStatus
  // ---------------------------------------------------------------------------

  describe('checkStatus', () => {
    it('returns new for unknown package', async () => {
      expect(await repo.checkStatus('unknown', 'sha256:x')).toBe('new');
    });

    it('returns consistent when checksum matches active version', async () => {
      await repo.registerPackage({
        name: 'test.pkg',
        version: '1.0.0',
        checksum: 'sha256:match',
        schemaSnapshot: null,
      });
      expect(await repo.checkStatus('test.pkg', 'sha256:match')).toBe('consistent');
    });

    it('returns upgrade when checksum differs from active version', async () => {
      await repo.registerPackage({
        name: 'test.pkg',
        version: '1.0.0',
        checksum: 'sha256:old',
        schemaSnapshot: null,
      });
      expect(await repo.checkStatus('test.pkg', 'sha256:new')).toBe('upgrade');
    });
  });

  // ---------------------------------------------------------------------------
  // schema_version records
  // ---------------------------------------------------------------------------

  describe('schema_version records', () => {
    it('registerPackage creates schema_version record', async () => {
      await repo.registerPackage({
        name: 'pkg-a',
        version: '1.0.0',
        checksum: 'sha256:a1',
        schemaSnapshot: null,
      });

      const versions = await repo.getSchemaVersions();
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].description).toContain('pkg-a@1.0.0');

      const packageList = JSON.parse(versions[0].packageList);
      expect(packageList).toEqual([{ name: 'pkg-a', version: '1.0.0' }]);
    });

    it('multiple registrations create incremental schema versions', async () => {
      await repo.registerPackage({
        name: 'pkg-a',
        version: '1.0.0',
        checksum: 'sha256:a1',
        schemaSnapshot: null,
      });
      await repo.registerPackage({
        name: 'pkg-b',
        version: '2.0.0',
        checksum: 'sha256:b1',
        schemaSnapshot: null,
      });

      const versions = await repo.getSchemaVersions();
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);

      // Second version should have both packages in the list
      const v2List = JSON.parse(versions[1].packageList);
      expect(v2List).toHaveLength(2);
      expect(v2List).toContainEqual({ name: 'pkg-a', version: '1.0.0' });
      expect(v2List).toContainEqual({ name: 'pkg-b', version: '2.0.0' });
    });

    it('upgrade reflects new version in schema_version packageList', async () => {
      await repo.registerPackage({
        name: 'pkg-a',
        version: '1.0.0',
        checksum: 'sha256:a1',
        schemaSnapshot: null,
      });
      await repo.registerPackage({
        name: 'pkg-a',
        version: '2.0.0',
        checksum: 'sha256:a2',
        schemaSnapshot: null,
      });

      const latest = await repo.getLatestSchemaVersion();
      expect(latest).toBeDefined();
      expect(latest!.version).toBe(2);

      const packageList = JSON.parse(latest!.packageList);
      expect(packageList).toEqual([{ name: 'pkg-a', version: '2.0.0' }]);
    });

    it('getLatestSchemaVersion returns undefined when no versions', async () => {
      const latest = await repo.getLatestSchemaVersion();
      expect(latest).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // removePackage
  // ---------------------------------------------------------------------------

  describe('removePackage', () => {
    it('removes all versions of a package', async () => {
      await repo.registerPackage({
        name: 'remove-me',
        version: '1.0.0',
        checksum: 'sha256:r1',
        schemaSnapshot: null,
      });
      await repo.registerPackage({
        name: 'remove-me',
        version: '2.0.0',
        checksum: 'sha256:r2',
        schemaSnapshot: null,
      });

      await repo.removePackage('remove-me');

      const all = await repo.getInstalledPackages();
      expect(all.filter(p => p.name === 'remove-me')).toHaveLength(0);
    });
  });
});
