/**
 * B3: IndexingPipeline with RuntimeProvider Tests
 *
 * Verifies that IndexingPipeline correctly delegates to RuntimeProvider
 * when available, and falls back to extractPropertyPath when not.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexingPipeline } from '../../repo/indexing-pipeline.js';
import { PropertyPathRuntimeProvider } from '../../providers/property-path-runtime-provider.js';
import type { RuntimeProvider, ExtractedReference } from '../../providers/runtime-provider.js';
import type { SearchParameterDef } from '../../providers/definition-provider.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import type { StorageAdapter } from '../../db/adapter.js';

// =============================================================================
// Mock StorageAdapter (minimal)
// =============================================================================

function createMockAdapter(): StorageAdapter {
  const executedQueries: Array<{ sql: string; values: unknown[] }> = [];
  return {
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    execute: vi.fn().mockImplementation((sql: string, values: unknown[]) => {
      executedQueries.push({ sql, values });
      return Promise.resolve();
    }),
    transaction: vi.fn().mockImplementation(async (fn: (tx: any) => void) => {
      fn({
        execute: (sql: string, values: unknown[]) => {
          executedQueries.push({ sql, values });
        },
      });
    }),
    close: vi.fn(),
    _executedQueries: executedQueries,
  } as unknown as StorageAdapter & { _executedQueries: typeof executedQueries };
}

// =============================================================================
// Fixtures
// =============================================================================

const PATIENT_IMPLS: SearchParameterImpl[] = [
  {
    code: 'birthdate',
    type: 'date',
    resourceTypes: ['Patient'],
    expression: 'Patient.birthDate',
    strategy: 'column',
    columnName: 'birthDate',
    columnType: 'TIMESTAMPTZ',
    array: false,
  },
  {
    code: 'gender',
    type: 'token',
    resourceTypes: ['Patient'],
    expression: 'Patient.gender',
    strategy: 'token-column',
    columnName: 'gender',
    columnType: 'TEXT',
    array: false,
  },
];

const OBSERVATION_IMPLS: SearchParameterImpl[] = [
  {
    code: 'subject',
    type: 'reference',
    resourceTypes: ['Observation'],
    expression: 'Observation.subject',
    strategy: 'column',
    columnName: 'subject',
    columnType: 'TEXT',
    array: false,
  },
  {
    code: 'status',
    type: 'token',
    resourceTypes: ['Observation'],
    expression: 'Observation.status',
    strategy: 'token-column',
    columnName: 'status',
    columnType: 'TEXT',
    array: false,
  },
  {
    code: 'date',
    type: 'date',
    resourceTypes: ['Observation'],
    expression: 'Observation.effectiveDateTime',
    strategy: 'column',
    columnName: 'date',
    columnType: 'TIMESTAMPTZ',
    array: false,
  },
];

// =============================================================================
// Tests
// =============================================================================

describe('B3: IndexingPipeline with RuntimeProvider', () => {

  // ---------------------------------------------------------------------------
  // extractSearchColumns via RuntimeProvider
  // ---------------------------------------------------------------------------

  describe('extractSearchColumns with RuntimeProvider', () => {
    it('uses RuntimeProvider.extractSearchValues when available', () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const patient = {
        resourceType: 'Patient',
        id: 'p-1',
        birthDate: '1990-01-15',
        gender: 'male',
      };

      const columns = pipeline.extractSearchColumns(patient as any, PATIENT_IMPLS);

      // birthdate should be extracted via RuntimeProvider → column strategy
      expect(columns.birthDate).toBe('1990-01-15');
      // gender should be extracted via RuntimeProvider → token-column strategy
      // v2 DDL: __gender (JSON array), __genderSort (display text)
      expect(columns.__gender).toBeDefined();
      expect(columns.__genderSort).toBeDefined();
    });

    it('column strategy stores single value directly', () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        effectiveDateTime: '2024-06-01T10:00:00Z',
        status: 'final',
      };

      const columns = pipeline.extractSearchColumns(obs as any, OBSERVATION_IMPLS);
      expect(columns.date).toBe('2024-06-01T10:00:00Z');
    });

    it('token-column strategy stores JSON-stringified array', () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
      };

      const columns = pipeline.extractSearchColumns(obs as any, OBSERVATION_IMPLS);
      // v2 DDL: __status TEXT (JSON array), __statusSort TEXT
      const parsed = JSON.parse(columns.__status as string);
      expect(parsed).toContain('final');
      expect(columns.__statusSort).toBe('final');
    });
  });

  // ---------------------------------------------------------------------------
  // extractReferences via RuntimeProvider
  // ---------------------------------------------------------------------------

  describe('extractReferences with RuntimeProvider', () => {
    it('uses RuntimeProvider.extractReferences when available', () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        subject: { reference: 'Patient/p-1' },
      };

      const refs = pipeline.extractReferences(obs as any, OBSERVATION_IMPLS);
      expect(refs).toHaveLength(1);
      expect(refs[0].resourceId).toBe('obs-1');
      expect(refs[0].targetType).toBe('Patient');
      expect(refs[0].targetId).toBe('p-1');
      expect(refs[0].code).toBe('subject');
      expect(refs[0].referenceRaw).toBe('Patient/p-1');
    });

    it('returns empty for resource without references', () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
      };

      const refs = pipeline.extractReferences(obs as any, OBSERVATION_IMPLS);
      expect(refs).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Fallback to buildSearchColumns when no RuntimeProvider
  // ---------------------------------------------------------------------------

  describe('Fallback without RuntimeProvider', () => {
    it('falls back to buildSearchColumns when no RuntimeProvider', () => {
      const adapter = createMockAdapter();
      const pipeline = new IndexingPipeline(adapter); // no runtimeProvider

      const patient = {
        resourceType: 'Patient',
        id: 'p-1',
        birthDate: '1990-01-15',
      };

      const columns = pipeline.extractSearchColumns(patient as any, PATIENT_IMPLS);
      // Should still work via extractPropertyPath fallback
      expect(columns.birthDate).toBe('1990-01-15');
    });

    it('falls back to extractReferencesV2 when no RuntimeProvider', () => {
      const adapter = createMockAdapter();
      const pipeline = new IndexingPipeline(adapter); // no runtimeProvider

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        subject: { reference: 'Patient/p-1' },
      };

      const refs = pipeline.extractReferences(obs as any, OBSERVATION_IMPLS);
      expect(refs).toHaveLength(1);
      expect(refs[0].targetType).toBe('Patient');
    });
  });

  // ---------------------------------------------------------------------------
  // Custom RuntimeProvider mock
  // ---------------------------------------------------------------------------

  describe('Custom RuntimeProvider delegation', () => {
    it('delegates to custom RuntimeProvider.extractSearchValues', () => {
      const adapter = createMockAdapter();
      const mockRuntime: RuntimeProvider = {
        extractSearchValues: vi.fn().mockReturnValue({
          birthdate: ['2000-12-25'],
          gender: ['custom-value'],
        }),
        extractReferences: vi.fn().mockReturnValue([]),
      };

      const pipeline = new IndexingPipeline(adapter, { runtimeProvider: mockRuntime });

      const patient = {
        resourceType: 'Patient',
        id: 'p-1',
      };

      const columns = pipeline.extractSearchColumns(patient as any, PATIENT_IMPLS);

      expect(mockRuntime.extractSearchValues).toHaveBeenCalledOnce();
      expect(columns.birthDate).toBe('2000-12-25');
    });

    it('delegates to custom RuntimeProvider.extractReferences', () => {
      const adapter = createMockAdapter();
      const mockRefs: ExtractedReference[] = [
        {
          code: 'subject',
          reference: 'Patient/custom-1',
          targetType: 'Patient',
          targetId: 'custom-1',
        },
      ];
      const mockRuntime: RuntimeProvider = {
        extractSearchValues: vi.fn().mockReturnValue({}),
        extractReferences: vi.fn().mockReturnValue(mockRefs),
      };

      const pipeline = new IndexingPipeline(adapter, { runtimeProvider: mockRuntime });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
      };

      const refs = pipeline.extractReferences(obs as any, OBSERVATION_IMPLS);

      expect(mockRuntime.extractReferences).toHaveBeenCalledOnce();
      expect(refs).toHaveLength(1);
      expect(refs[0].targetId).toBe('custom-1');
      expect(refs[0].referenceRaw).toBe('Patient/custom-1');
    });

    it('passes correctly converted SearchParameterDefs to RuntimeProvider', () => {
      const adapter = createMockAdapter();
      let capturedParams: SearchParameterDef[] = [];
      const mockRuntime: RuntimeProvider = {
        extractSearchValues: vi.fn().mockImplementation(
          (_resource: unknown, params: SearchParameterDef[]) => {
            capturedParams = params;
            return {};
          },
        ),
        extractReferences: vi.fn().mockReturnValue([]),
      };

      const pipeline = new IndexingPipeline(adapter, { runtimeProvider: mockRuntime });
      pipeline.extractSearchColumns(
        { resourceType: 'Patient', id: 'p-1' } as any,
        PATIENT_IMPLS,
      );

      expect(capturedParams).toHaveLength(2);
      expect(capturedParams[0].code).toBe('birthdate');
      expect(capturedParams[0].type).toBe('date');
      expect(capturedParams[0].base).toEqual(['Patient']);
      expect(capturedParams[0].expression).toBe('Patient.birthDate');
      expect(capturedParams[0].resourceType).toBe('SearchParameter');
    });
  });

  // ---------------------------------------------------------------------------
  // indexResource with RuntimeProvider (end-to-end with mock adapter)
  // ---------------------------------------------------------------------------

  describe('indexResource with RuntimeProvider', () => {
    it('uses RuntimeProvider for both search columns and references', async () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, {
        runtimeProvider,
        enableLookupTables: false,
      });

      const obs = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        effectiveDateTime: '2024-06-01',
        subject: { reference: 'Patient/p-1' },
      };

      const result = await pipeline.indexResource('Observation', obs as any, OBSERVATION_IMPLS);

      // Search columns extracted
      expect(result.searchColumns.date).toBe('2024-06-01');

      // References written
      expect(result.referenceCount).toBe(1);
    });

    it('handles resource without id gracefully', async () => {
      const adapter = createMockAdapter();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const pipeline = new IndexingPipeline(adapter, { runtimeProvider });

      const result = await pipeline.indexResource(
        'Patient',
        { resourceType: 'Patient' } as any,
        PATIENT_IMPLS,
      );

      expect(result.searchColumns).toEqual({});
      expect(result.referenceCount).toBe(0);
    });
  });
});
