/**
 * Repository Error Hierarchy
 *
 * Maps to standard FHIR/HTTP error semantics:
 * - 404 Not Found → ResourceNotFoundError
 * - 410 Gone → ResourceGoneError
 * - 412 Precondition Failed → ResourceVersionConflictError
 *
 * @module fhir-persistence/repo
 */

// =============================================================================
// Section 1: Base Error
// =============================================================================

/**
 * Base class for all repository errors.
 */
export class RepositoryError extends Error {
  override readonly name: string = 'RepositoryError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// Section 2: Specific Errors
// =============================================================================

/**
 * Resource not found (HTTP 404).
 */
export class ResourceNotFoundError extends RepositoryError {
  override readonly name = 'ResourceNotFoundError';
  readonly resourceType: string;
  readonly resourceId: string;

  constructor(resourceType: string, id: string) {
    super(`${resourceType}/${id} not found`);
    this.resourceType = resourceType;
    this.resourceId = id;
  }
}

/**
 * Resource has been deleted (HTTP 410 Gone).
 */
export class ResourceGoneError extends RepositoryError {
  override readonly name = 'ResourceGoneError';
  readonly resourceType: string;
  readonly resourceId: string;

  constructor(resourceType: string, id: string) {
    super(`${resourceType}/${id} has been deleted`);
    this.resourceType = resourceType;
    this.resourceId = id;
  }
}

/**
 * Multiple matches found for conditional operation (HTTP 412 Precondition Failed).
 *
 * Thrown when a conditional update/delete matches more than one resource.
 */
export class PreconditionFailedError extends RepositoryError {
  override readonly name = 'PreconditionFailedError';
  readonly resourceType: string;
  readonly matchCount: number;

  constructor(resourceType: string, matchCount: number) {
    super(
      `Conditional operation on ${resourceType} matched ${matchCount} resources (expected 0 or 1)`,
    );
    this.resourceType = resourceType;
    this.matchCount = matchCount;
  }
}

/**
 * Optimistic locking conflict (HTTP 412 Precondition Failed).
 *
 * Thrown when `ifMatch` (expected versionId) does not match
 * the current versionId of the resource.
 */
export class ResourceVersionConflictError extends RepositoryError {
  override readonly name = 'ResourceVersionConflictError';
  readonly resourceType: string;
  readonly resourceId: string;
  readonly expectedVersion: string;
  readonly actualVersion: string;

  constructor(
    resourceType: string,
    id: string,
    expectedVersion: string,
    actualVersion: string,
  ) {
    super(
      `Version conflict for ${resourceType}/${id}: ` +
      `expected ${expectedVersion}, actual ${actualVersion}`,
    );
    this.resourceType = resourceType;
    this.resourceId = id;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}
