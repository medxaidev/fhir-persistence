/**
 * Repository Errors — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  RepositoryError,
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../../repo/errors.js';

describe('RepositoryError', () => {
  it('is an instance of Error', () => {
    const err = new RepositoryError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(RepositoryError);
    expect(err.name).toBe('RepositoryError');
    expect(err.message).toBe('test');
  });

  it('has a stack trace', () => {
    const err = new RepositoryError('stack test');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('stack test');
  });

  it('can be caught as Error', () => {
    try {
      throw new RepositoryError('catch me');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe('catch me');
    }
  });

  it('preserves prototype chain with Object.setPrototypeOf', () => {
    const err = new RepositoryError('proto');
    expect(Object.getPrototypeOf(err)).toBe(RepositoryError.prototype);
  });
});

describe('ResourceNotFoundError', () => {
  it('has correct name, message, and properties', () => {
    const err = new ResourceNotFoundError('Patient', 'abc-123');
    expect(err).toBeInstanceOf(RepositoryError);
    expect(err).toBeInstanceOf(ResourceNotFoundError);
    expect(err.name).toBe('ResourceNotFoundError');
    expect(err.message).toBe('Patient/abc-123 not found');
    expect(err.resourceType).toBe('Patient');
    expect(err.resourceId).toBe('abc-123');
  });

  it('works with different resource types', () => {
    const err = new ResourceNotFoundError('Observation', 'obs-1');
    expect(err.message).toBe('Observation/obs-1 not found');
    expect(err.resourceType).toBe('Observation');
    expect(err.resourceId).toBe('obs-1');
  });

  it('is catchable as RepositoryError', () => {
    try {
      throw new ResourceNotFoundError('Patient', 'x');
    } catch (e) {
      expect(e).toBeInstanceOf(RepositoryError);
    }
  });
});

describe('ResourceGoneError', () => {
  it('has correct name, message, and properties', () => {
    const err = new ResourceGoneError('Observation', 'xyz-789');
    expect(err).toBeInstanceOf(RepositoryError);
    expect(err).toBeInstanceOf(ResourceGoneError);
    expect(err.name).toBe('ResourceGoneError');
    expect(err.message).toBe('Observation/xyz-789 has been deleted');
    expect(err.resourceType).toBe('Observation');
    expect(err.resourceId).toBe('xyz-789');
  });

  it('works with different resource types', () => {
    const err = new ResourceGoneError('Condition', 'c-1');
    expect(err.message).toBe('Condition/c-1 has been deleted');
    expect(err.resourceType).toBe('Condition');
  });

  it('is catchable as RepositoryError', () => {
    try {
      throw new ResourceGoneError('Patient', 'x');
    } catch (e) {
      expect(e).toBeInstanceOf(RepositoryError);
    }
  });
});

describe('ResourceVersionConflictError', () => {
  it('has correct name, message, and properties', () => {
    const err = new ResourceVersionConflictError('Patient', 'abc', 'v1', 'v2');
    expect(err).toBeInstanceOf(RepositoryError);
    expect(err).toBeInstanceOf(ResourceVersionConflictError);
    expect(err.name).toBe('ResourceVersionConflictError');
    expect(err.message).toContain('Version conflict');
    expect(err.message).toContain('expected v1');
    expect(err.message).toContain('actual v2');
    expect(err.resourceType).toBe('Patient');
    expect(err.resourceId).toBe('abc');
    expect(err.expectedVersion).toBe('v1');
    expect(err.actualVersion).toBe('v2');
  });

  it('includes resource reference in message', () => {
    const err = new ResourceVersionConflictError('Observation', 'obs-1', 'a', 'b');
    expect(err.message).toContain('Observation/obs-1');
  });

  it('is catchable as RepositoryError', () => {
    try {
      throw new ResourceVersionConflictError('Patient', 'x', 'v1', 'v2');
    } catch (e) {
      expect(e).toBeInstanceOf(RepositoryError);
    }
  });

  it('stores UUID-format version IDs', () => {
    const err = new ResourceVersionConflictError(
      'Patient', 'p1',
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001',
    );
    expect(err.expectedVersion).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(err.actualVersion).toBe('660e8400-e29b-41d4-a716-446655440001');
  });
});
