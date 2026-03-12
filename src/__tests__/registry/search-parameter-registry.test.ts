/**
 * Tests for SearchParameterRegistry — Task 8.3
 *
 * Covers:
 * - indexBundle: basic indexing, skipping, multi-resource params
 * - Strategy resolution: column, token-column, lookup-table
 * - Column type mapping: date→TIMESTAMPTZ, string→TEXT, token→UUID[]
 * - Code → column name conversion (hyphen → camelCase)
 * - getForResource / getImpl / hasResource
 * - Integration: real search-parameters.json
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  SearchParameterRegistry,
} from '../../registry/search-parameter-registry.js';
import type {
  SearchParameterBundle,
  SearchParameterResource,
} from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function specPath(filename: string): string {
  return resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4', filename);
}

function makeBundle(entries: SearchParameterResource[]): SearchParameterBundle {
  return {
    resourceType: 'Bundle',
    entry: entries.map((resource) => ({ resource })),
  };
}

function makeSP(overrides: Partial<SearchParameterResource> = {}): SearchParameterResource {
  return {
    resourceType: 'SearchParameter',
    code: 'birthdate',
    type: 'date',
    base: ['Patient'],
    expression: 'Patient.birthDate',
    ...overrides,
  };
}

// =============================================================================
// Section 1: Unit Tests — Strategy Resolution
// =============================================================================

describe('SearchParameterRegistry — Strategy Resolution', () => {
  let registry: SearchParameterRegistry;

  beforeEach(() => {
    registry = new SearchParameterRegistry();
  });

  it('date param → column strategy, TIMESTAMPTZ type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'] }),
    ]));
    const impl = registry.getImpl('Patient', 'birthdate');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TIMESTAMPTZ');
    expect(impl!.array).toBe(false);
  });

  it('string param → column strategy, TEXT type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'family', type: 'string', base: ['Patient'], expression: 'Patient.name.family' }),
    ]));
    // 'family' is in LOOKUP_TABLE_PARAMS
    const impl = registry.getImpl('Patient', 'family');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('lookup-table');
  });

  it('non-lookup string param → column strategy, TEXT[] when path has array element', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'language', type: 'string', base: ['Patient'], expression: 'Patient.communication.language' }),
    ]));
    const impl = registry.getImpl('Patient', 'language');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    // Patient.communication has max='*' → array
    expect(impl!.columnType).toBe('TEXT[]');
  });

  it('reference param → column strategy, TEXT type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'subject', type: 'reference', base: ['Observation'], expression: 'Observation.subject' }),
    ]));
    const impl = registry.getImpl('Observation', 'subject');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TEXT');
  });

  it('number param → column strategy, DOUBLE PRECISION type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'length', type: 'number', base: ['Encounter'], expression: 'Encounter.length' }),
    ]));
    const impl = registry.getImpl('Encounter', 'length');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('DOUBLE PRECISION');
  });

  it('quantity param → column strategy, DOUBLE PRECISION type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'value-quantity', type: 'quantity', base: ['Observation'], expression: 'Observation.value' }),
    ]));
    const impl = registry.getImpl('Observation', 'value-quantity');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('DOUBLE PRECISION');
    expect(impl!.columnName).toBe('valueQuantity');
  });

  it('uri param → column strategy, TEXT type', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'url', type: 'uri', base: ['ValueSet'], expression: 'ValueSet.url' }),
    ]));
    const impl = registry.getImpl('ValueSet', 'url');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TEXT');
  });

  it('token param → token-column strategy, UUID[] type, array=true', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'identifier', type: 'token', base: ['Patient'], expression: 'Patient.identifier' }),
    ]));
    const impl = registry.getImpl('Patient', 'identifier');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('token-column');
    expect(impl!.columnType).toBe('UUID[]');
    expect(impl!.array).toBe(true);
  });

  it('lookup-table params: name, address, phone, email', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'name', type: 'string', base: ['Patient'], expression: 'Patient.name' }),
      makeSP({ code: 'address', type: 'string', base: ['Patient'], expression: 'Patient.address' }),
      makeSP({ code: 'phone', type: 'token', base: ['Patient'], expression: 'Patient.telecom.where(system=\'phone\')' }),
      makeSP({ code: 'email', type: 'token', base: ['Patient'], expression: 'Patient.telecom.where(system=\'email\')' }),
    ]));
    expect(registry.getImpl('Patient', 'name')!.strategy).toBe('lookup-table');
    expect(registry.getImpl('Patient', 'address')!.strategy).toBe('lookup-table');
    expect(registry.getImpl('Patient', 'phone')!.strategy).toBe('lookup-table');
    expect(registry.getImpl('Patient', 'email')!.strategy).toBe('lookup-table');
  });
});

// =============================================================================
// Section 2: Unit Tests — Skipping & Filtering
// =============================================================================

describe('SearchParameterRegistry — Skipping & Filtering', () => {
  let registry: SearchParameterRegistry;

  beforeEach(() => {
    registry = new SearchParameterRegistry();
  });

  it('skips composite type params', () => {
    const result = registry.indexBundle(makeBundle([
      makeSP({ code: 'code-value-quantity', type: 'composite', base: ['Observation'] }),
    ]));
    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(1);
    expect(registry.getForResource('Observation')).toHaveLength(0);
  });

  it('skips special type params', () => {
    const result = registry.indexBundle(makeBundle([
      makeSP({ code: '_content', type: 'special', base: ['Resource'] }),
    ]));
    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('skips ignored params (_id, _lastUpdated, _profile, _compartment, _source)', () => {
    const result = registry.indexBundle(makeBundle([
      makeSP({ code: '_id', type: 'token', base: ['Resource'] }),
      makeSP({ code: '_lastUpdated', type: 'date', base: ['Resource'] }),
      makeSP({ code: '_profile', type: 'uri', base: ['Resource'] }),
      makeSP({ code: '_compartment', type: 'token', base: ['Resource'] }),
      makeSP({ code: '_source', type: 'uri', base: ['Resource'] }),
    ]));
    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(5);
  });

  it('skips entries without base', () => {
    const result = registry.indexBundle(makeBundle([
      makeSP({ code: 'test', type: 'string', base: [] }),
    ]));
    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('skips non-SearchParameter entries', () => {
    const bundle: SearchParameterBundle = {
      resourceType: 'Bundle',
      entry: [
        { resource: { resourceType: 'SearchParameter', code: 'x', type: 'string', base: ['Patient'] } as SearchParameterResource },
        { resource: undefined },
      ],
    };
    const result = registry.indexBundle(bundle);
    expect(result.indexed).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('handles empty bundle', () => {
    const result = registry.indexBundle({ resourceType: 'Bundle' });
    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('skips abstract base types (Resource, DomainResource)', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: '_tag', type: 'token', base: ['Resource'] }),
    ]));
    // Should not be indexed under 'Resource' since it's abstract
    expect(registry.hasResource('Resource')).toBe(false);
  });
});

// =============================================================================
// Section 3: Unit Tests — Multi-resource & Column Name
// =============================================================================

describe('SearchParameterRegistry — Multi-resource & Column Name', () => {
  let registry: SearchParameterRegistry;

  beforeEach(() => {
    registry = new SearchParameterRegistry();
  });

  it('multi-resource param indexed for each base type', () => {
    registry.indexBundle(makeBundle([
      makeSP({
        code: 'date',
        type: 'date',
        base: ['AllergyIntolerance', 'CarePlan', 'Encounter'],
        expression: 'AllergyIntolerance.recordedDate | CarePlan.period | Encounter.period',
      }),
    ]));
    expect(registry.getImpl('AllergyIntolerance', 'date')).toBeDefined();
    expect(registry.getImpl('CarePlan', 'date')).toBeDefined();
    expect(registry.getImpl('Encounter', 'date')).toBeDefined();
  });

  it('hyphenated code → camelCase column name', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'birth-date', type: 'date', base: ['Patient'] }),
    ]));
    expect(registry.getImpl('Patient', 'birth-date')!.columnName).toBe('birthDate');
  });

  it('simple code → unchanged column name', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'active', type: 'token', base: ['Patient'] }),
    ]));
    expect(registry.getImpl('Patient', 'active')!.columnName).toBe('active');
  });

  it('multi-hyphen code → camelCase', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'value-quantity', type: 'quantity', base: ['Observation'] }),
    ]));
    expect(registry.getImpl('Observation', 'value-quantity')!.columnName).toBe('valueQuantity');
  });
});

// =============================================================================
// Section 4: Unit Tests — State Management
// =============================================================================

describe('SearchParameterRegistry — State Management', () => {
  let registry: SearchParameterRegistry;

  beforeEach(() => {
    registry = new SearchParameterRegistry();
  });

  it('getForResource returns sorted array', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'gender', type: 'token', base: ['Patient'] }),
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'] }),
      makeSP({ code: 'active', type: 'token', base: ['Patient'] }),
    ]));
    const params = registry.getForResource('Patient');
    expect(params.map((p) => p.code)).toEqual(['active', 'birthdate', 'gender']);
  });

  it('getForResource returns empty array for unknown resource', () => {
    expect(registry.getForResource('Unknown')).toEqual([]);
  });

  it('getResourceTypes returns sorted list', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'] }),
      makeSP({ code: 'date', type: 'date', base: ['Observation'] }),
    ]));
    expect(registry.getResourceTypes()).toEqual(['Observation', 'Patient']);
  });

  it('totalCount and skippedCount track correctly', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'] }),
      makeSP({ code: '_id', type: 'token', base: ['Resource'] }),
      makeSP({ code: 'combo', type: 'composite', base: ['Observation'] }),
    ]));
    expect(registry.totalCount).toBe(1);
    expect(registry.skippedCount).toBe(2);
  });

  it('clear resets all state', () => {
    registry.indexBundle(makeBundle([
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'] }),
    ]));
    expect(registry.resourceTypeCount).toBe(1);
    registry.clear();
    expect(registry.resourceTypeCount).toBe(0);
    expect(registry.totalCount).toBe(0);
    expect(registry.skippedCount).toBe(0);
    expect(registry.getForResource('Patient')).toEqual([]);
  });

  it('indexImpl adds a custom param directly', () => {
    registry.indexImpl('Patient', {
      code: 'custom-field',
      type: 'string',
      resourceTypes: ['Patient'],
      expression: 'Patient.extension("custom")',
      strategy: 'column',
      columnName: 'customField',
      columnType: 'TEXT',
      array: false,
    });
    expect(registry.getImpl('Patient', 'custom-field')).toBeDefined();
    expect(registry.totalCount).toBe(1);
  });
});

// =============================================================================
// Section 5: Integration Tests (real spec files)
// =============================================================================

describe('SearchParameterRegistry — Integration', () => {
  it('indexes all params from search-parameters.json', () => {
    const bundle = JSON.parse(
      readFileSync(specPath('search-parameters.json'), 'utf8'),
    ) as SearchParameterBundle;

    const registry = new SearchParameterRegistry();
    const result = registry.indexBundle(bundle);

    // Should index a significant number of params
    expect(result.indexed).toBeGreaterThan(900);
    // Should skip composite, special, and ignored params
    expect(result.skipped).toBeGreaterThan(50);

    // Should have params for many resource types
    expect(registry.resourceTypeCount).toBeGreaterThan(100);
  });

  it('Patient has expected search params', () => {
    const bundle = JSON.parse(
      readFileSync(specPath('search-parameters.json'), 'utf8'),
    ) as SearchParameterBundle;

    const registry = new SearchParameterRegistry();
    registry.indexBundle(bundle);

    const patientParams = registry.getForResource('Patient');
    expect(patientParams.length).toBeGreaterThan(10);

    // Check specific params
    const birthdate = registry.getImpl('Patient', 'birthdate');
    expect(birthdate).toBeDefined();
    expect(birthdate!.strategy).toBe('column');
    expect(birthdate!.columnType).toBe('TIMESTAMPTZ');

    const gender = registry.getImpl('Patient', 'gender');
    expect(gender).toBeDefined();
    expect(gender!.strategy).toBe('token-column');

    const name = registry.getImpl('Patient', 'name');
    expect(name).toBeDefined();
    expect(name!.strategy).toBe('lookup-table');
  });

  it('Observation has expected search params', () => {
    const bundle = JSON.parse(
      readFileSync(specPath('search-parameters.json'), 'utf8'),
    ) as SearchParameterBundle;

    const registry = new SearchParameterRegistry();
    registry.indexBundle(bundle);

    const obsParams = registry.getForResource('Observation');
    expect(obsParams.length).toBeGreaterThan(10);

    const code = registry.getImpl('Observation', 'code');
    expect(code).toBeDefined();
    expect(code!.strategy).toBe('token-column');

    const subject = registry.getImpl('Observation', 'subject');
    expect(subject).toBeDefined();
    expect(subject!.strategy).toBe('column');
    // Observation.subject has max='1' in FHIR → TEXT (scalar), regardless of multiple targets
    expect(subject!.columnType).toBe('TEXT');
    expect(subject!.array).toBe(false);
  });
});
