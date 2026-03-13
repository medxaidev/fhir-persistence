/**
 * Platform IG Definitions Tests — 12 pure unit tests.
 */
import { describe, it, expect } from 'vitest';
import {
  getPlatformProfiles,
  getPlatformResourceTypes,
  getPlatformSearchParameters,
  getSearchParametersForType,
  getPackageChecksum,
  PLATFORM_PACKAGE_NAME,
  PLATFORM_PACKAGE_VERSION,
} from '../../platform/platform-ig-definitions.js';

describe('PlatformIGDefinitions', () => {
  // =========================================================================
  // 1. defines 5 platform resource types
  // =========================================================================
  it('defines 5 platform resource types', () => {
    const types = getPlatformResourceTypes();
    expect(types).toHaveLength(5);
    expect(types.sort()).toEqual(['Agent', 'Bot', 'ClientApplication', 'Project', 'User']);
  });

  // =========================================================================
  // 2. each resource has kind=resource, abstract=false
  // =========================================================================
  it('each profile has kind=resource and abstract=false', () => {
    const profiles = getPlatformProfiles();
    for (const p of profiles) {
      expect(p.kind).toBe('resource');
      expect(p.abstract).toBe(false);
    }
  });

  // =========================================================================
  // 3. User has email/name/active search params
  // =========================================================================
  it('User has user-email, display-name, active search params', () => {
    const sps = getSearchParametersForType('User');
    const codes = sps.map(sp => sp.code).sort();
    expect(codes).toEqual(['active', 'display-name', 'user-email']);
  });

  // =========================================================================
  // 4. Bot has name/identifier/status search params
  // =========================================================================
  it('Bot has display-name, identifier, status search params', () => {
    const sps = getSearchParametersForType('Bot');
    const codes = sps.map(sp => sp.code).sort();
    expect(codes).toEqual(['display-name', 'identifier', 'status']);
  });

  // =========================================================================
  // 5. Project has name/identifier/active search params
  // =========================================================================
  it('Project has display-name, identifier, active search params', () => {
    const sps = getSearchParametersForType('Project');
    const codes = sps.map(sp => sp.code).sort();
    expect(codes).toEqual(['active', 'display-name', 'identifier']);
  });

  // =========================================================================
  // 6. Agent has name/status/identifier search params
  // =========================================================================
  it('Agent has display-name, status, identifier search params', () => {
    const sps = getSearchParametersForType('Agent');
    const codes = sps.map(sp => sp.code).sort();
    expect(codes).toEqual(['display-name', 'identifier', 'status']);
  });

  // =========================================================================
  // 7. ClientApplication has name/identifier/status search params
  // =========================================================================
  it('ClientApplication has display-name, identifier, status search params', () => {
    const sps = getSearchParametersForType('ClientApplication');
    const codes = sps.map(sp => sp.code).sort();
    expect(codes).toEqual(['display-name', 'identifier', 'status']);
  });

  // =========================================================================
  // 8. all SearchParameters have valid base/code/type/expression
  // =========================================================================
  it('all SearchParameters have valid base, code, type, expression', () => {
    const sps = getPlatformSearchParameters();
    for (const sp of sps) {
      expect(sp.resourceType).toBe('SearchParameter');
      expect(sp.base.length).toBeGreaterThan(0);
      expect(sp.code).toBeTruthy();
      expect(['string', 'token', 'reference', 'date']).toContain(sp.type);
      expect(sp.expression).toBeTruthy();
      expect(sp.url).toBeTruthy();
    }
  });

  // =========================================================================
  // 9. no duplicate SP codes within same resource
  // =========================================================================
  it('no duplicate SP codes within same resource type', () => {
    const types = getPlatformResourceTypes();
    for (const type of types) {
      const sps = getSearchParametersForType(type);
      const codes = sps.map(sp => sp.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    }
  });

  // =========================================================================
  // 10. package metadata has correct name/version
  // =========================================================================
  it('package metadata has correct name and version', () => {
    expect(PLATFORM_PACKAGE_NAME).toBe('medxai.core');
    expect(PLATFORM_PACKAGE_VERSION).toBe('1.0.0');
  });

  // =========================================================================
  // 11. getChecksum returns deterministic value
  // =========================================================================
  it('getPackageChecksum returns deterministic value', () => {
    const checksum1 = getPackageChecksum();
    const checksum2 = getPackageChecksum();
    expect(checksum1).toBe(checksum2);
    expect(checksum1).toContain('medxai-core-1.0.0-');
  });

  // =========================================================================
  // 12. getProfiles returns all 5 CanonicalProfile objects
  // =========================================================================
  it('getPlatformProfiles returns 5 profiles with url and elements', () => {
    const profiles = getPlatformProfiles();
    expect(profiles).toHaveLength(5);
    for (const p of profiles) {
      expect(p.url).toContain('http://medxai.com/fhir/StructureDefinition/');
      expect(p.elements).toBeInstanceOf(Map);
      expect(p.name).toBe(p.type);
    }
  });
});
