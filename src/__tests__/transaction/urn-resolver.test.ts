/**
 * URN Resolver v2 Tests — 12 tests covering buildUrnMap + deepResolveUrns.
 */
import { describe, it, expect } from 'vitest';
import { buildUrnMap, deepResolveUrns } from '../../transaction/urn-resolver.js';
import type { BundleEntryForUrn, UrnTarget } from '../../transaction/urn-resolver.js';
import type { FhirResource } from '../../repo/types.js';

describe('buildUrnMap', () => {
  // =========================================================================
  // 1. POST entries with urn:uuid get new IDs
  // =========================================================================
  it('assigns new IDs for POST entries with urn:uuid fullUrl', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'urn:uuid:aaa-bbb',
        resource: { resourceType: 'Patient' } as FhirResource,
        request: { method: 'POST', url: 'Patient' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.size).toBe(1);
    const target = map.get('urn:uuid:aaa-bbb');
    expect(target).toBeDefined();
    expect(target!.id).toBeTruthy();
    expect(typeof target!.id).toBe('string');
  });

  // =========================================================================
  // 2. Carries resourceType from entry.resource
  // =========================================================================
  it('carries resourceType from entry.resource', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'urn:uuid:111',
        resource: { resourceType: 'Observation' } as FhirResource,
        request: { method: 'POST', url: 'Observation' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.get('urn:uuid:111')!.resourceType).toBe('Observation');
  });

  // =========================================================================
  // 3. Non-POST entries are skipped
  // =========================================================================
  it('skips non-POST entries', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'urn:uuid:222',
        resource: { resourceType: 'Patient' } as FhirResource,
        request: { method: 'PUT', url: 'Patient/222' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.size).toBe(0);
  });

  // =========================================================================
  // 4. Entries without urn:uuid are skipped
  // =========================================================================
  it('skips entries without urn:uuid fullUrl', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'http://example.com/Patient/1',
        resource: { resourceType: 'Patient' } as FhirResource,
        request: { method: 'POST', url: 'Patient' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.size).toBe(0);
  });

  // =========================================================================
  // 5. Multiple entries each get unique IDs
  // =========================================================================
  it('assigns unique IDs to multiple entries', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'urn:uuid:a1',
        resource: { resourceType: 'Patient' } as FhirResource,
        request: { method: 'POST', url: 'Patient' },
      },
      {
        fullUrl: 'urn:uuid:b2',
        resource: { resourceType: 'Encounter' } as FhirResource,
        request: { method: 'POST', url: 'Encounter' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.size).toBe(2);
    const a = map.get('urn:uuid:a1')!;
    const b = map.get('urn:uuid:b2')!;
    expect(a.id).not.toBe(b.id);
    expect(a.resourceType).toBe('Patient');
    expect(b.resourceType).toBe('Encounter');
  });

  // =========================================================================
  // 6. Entries without resource are skipped
  // =========================================================================
  it('skips entries without resource', () => {
    const entries: BundleEntryForUrn[] = [
      {
        fullUrl: 'urn:uuid:no-resource',
        request: { method: 'POST', url: 'Patient' },
      },
    ];
    const map = buildUrnMap(entries);
    expect(map.size).toBe(0);
  });
});

describe('deepResolveUrns', () => {
  const urnMap = new Map<string, UrnTarget>([
    ['urn:uuid:pat-1', { id: 'real-pat-1', resourceType: 'Patient' }],
    ['urn:uuid:enc-1', { id: 'real-enc-1', resourceType: 'Encounter' }],
  ]);

  // =========================================================================
  // 7. Replaces .reference fields matching urn:uuid
  // =========================================================================
  it('replaces .reference fields matching urn:uuid', () => {
    const resource = {
      resourceType: 'Observation',
      subject: { reference: 'urn:uuid:pat-1' },
    } as FhirResource;
    const resolved = deepResolveUrns(resource, urnMap);
    expect((resolved as any).subject.reference).toBe('Patient/real-pat-1');
  });

  // =========================================================================
  // 8. Nested references are resolved
  // =========================================================================
  it('resolves nested references', () => {
    const resource = {
      resourceType: 'Observation',
      contained: [
        {
          resourceType: 'Condition',
          encounter: { reference: 'urn:uuid:enc-1' },
        },
      ],
    } as unknown as FhirResource;
    const resolved = deepResolveUrns(resource, urnMap);
    expect((resolved as any).contained[0].encounter.reference).toBe('Encounter/real-enc-1');
  });

  // =========================================================================
  // 9. Array references are resolved
  // =========================================================================
  it('resolves array references', () => {
    const resource = {
      resourceType: 'CarePlan',
      activity: [
        { reference: { reference: 'urn:uuid:pat-1' } },
        { reference: { reference: 'urn:uuid:enc-1' } },
      ],
    } as unknown as FhirResource;
    const resolved = deepResolveUrns(resource, urnMap);
    expect((resolved as any).activity[0].reference.reference).toBe('Patient/real-pat-1');
    expect((resolved as any).activity[1].reference.reference).toBe('Encounter/real-enc-1');
  });

  // =========================================================================
  // 10. Non-matching references are preserved
  // =========================================================================
  it('preserves non-matching references', () => {
    const resource = {
      resourceType: 'Observation',
      subject: { reference: 'Patient/existing-123' },
    } as FhirResource;
    const resolved = deepResolveUrns(resource, urnMap);
    expect((resolved as any).subject.reference).toBe('Patient/existing-123');
  });

  // =========================================================================
  // 11. Empty urnMap returns resource unchanged
  // =========================================================================
  it('returns resource unchanged with empty urnMap', () => {
    const resource = {
      resourceType: 'Patient',
      name: [{ family: 'Smith' }],
    } as FhirResource;
    const emptyMap = new Map<string, UrnTarget>();
    const resolved = deepResolveUrns(resource, emptyMap);
    expect(resolved).toEqual(resource);
    // Should be the same object (not cloned) for perf
    expect(resolved).toBe(resource);
  });

  // =========================================================================
  // 12. Non-reference string fields are not replaced
  // =========================================================================
  it('does not replace non-reference string fields', () => {
    const resource = {
      resourceType: 'Patient',
      text: { div: 'urn:uuid:pat-1 appears in narrative' },
      identifier: [{ value: 'urn:uuid:pat-1' }],
    } as unknown as FhirResource;
    const resolved = deepResolveUrns(resource, urnMap);
    // text.div should NOT be replaced (it's not a .reference field)
    expect((resolved as any).text.div).toBe('urn:uuid:pat-1 appears in narrative');
    // identifier.value should NOT be replaced (it's not a .reference field)
    expect((resolved as any).identifier[0].value).toBe('urn:uuid:pat-1');
  });
});
