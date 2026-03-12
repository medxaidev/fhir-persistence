/**
 * Repository Types & Interfaces
 *
 * Defines the contract for FHIR resource persistence operations.
 * All implementations must support transactional CRUD with versioning.
 *
 * Design decisions (from WF-E2E-001 Medplum analysis):
 * - `id` and `versionId` are UUIDs, generated app-side
 * - Every write produces a new history entry (new version snapshot)
 * - Soft delete: `deleted=true`, `content=''`, `__version=-1`
 * - Optimistic locking via `ifMatch` (versionId comparison)
 *
 * @module fhir-persistence/repo
 */

// =============================================================================
// Section 0: Operation Context (ADR-006)
// =============================================================================

/**
 * Operation context — flows through all CRUD/Search operations.
 *
 * S1 (Phase B): Only `project` is used — multi-tenant isolation.
 * S5 (Phase C): Will extend to use `author`, `accessPolicy`, `superAdmin`.
 */
export interface OperationContext {
  /** Current project ID for multi-tenant scoping. */
  project?: string;

  /** The actor performing the operation (User/Bot/ClientApplication reference). */
  author?: string;

  /** The AccessPolicy ID bound to this operation. */
  accessPolicy?: string;

  /** Whether this is a super-admin operation (bypasses project scoping). */
  superAdmin?: boolean;
}

// =============================================================================
// Section 0b: Platform Resource Type Guards (ADR-006)
// =============================================================================

/**
 * Platform resource types that require special handling.
 *
 * These are MedXAI-defined resources (not part of FHIR R4 base spec).
 * They participate in multi-tenant isolation via `projectId`.
 */
export const PLATFORM_RESOURCE_TYPES: ReadonlySet<string> = new Set([
  'Project',
  'User',
  'ProjectMembership',
  'Login',
  'ClientApplication',
  'AccessPolicy',
  'JsonWebKey',
]);

/**
 * Protected resource types that can only be managed by super-admins or
 * the system itself. Normal project-scoped operations cannot create/update/delete these.
 *
 * Phase B: informational only — enforcement deferred to Phase C (Auth).
 */
export const PROTECTED_RESOURCE_TYPES: ReadonlySet<string> = new Set([
  'Project',
  'JsonWebKey',
]);

/**
 * Resource types that can be managed by project admins (not just super-admins).
 *
 * Phase B: informational only — enforcement deferred to Phase C (Auth).
 */
export const PROJECT_ADMIN_RESOURCE_TYPES: ReadonlySet<string> = new Set([
  'ProjectMembership',
  'ClientApplication',
  'AccessPolicy',
  'User',
  'Login',
]);

// =============================================================================
// Section 1: FHIR Resource Shape
// =============================================================================

/**
 * Minimal FHIR resource shape for persistence operations.
 *
 * This is intentionally loose — the repository does not validate
 * resource structure (that's the validator's job). It only requires
 * `resourceType` and optionally `id` / `meta`.
 */
export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: unknown;
}

/**
 * FHIR Meta element (subset used by the repository).
 */
export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  [key: string]: unknown;
}

/**
 * A FHIR resource that has been persisted (id and meta are guaranteed).
 */
export interface PersistedResource extends FhirResource {
  id: string;
  meta: FhirMeta & {
    versionId: string;
    lastUpdated: string;
  };
}

// =============================================================================
// Section 2: Repository Options
// =============================================================================

/**
 * Options for `createResource()`.
 */
export interface CreateResourceOptions {
  /**
   * Pre-assigned UUID for the resource.
   * Used in batch/transaction operations where the ID is determined
   * before the create call.
   */
  assignedId?: string;
}

/**
 * Options for `updateResource()`.
 */
export interface UpdateResourceOptions {
  /**
   * Expected versionId for optimistic locking.
   * If provided and does not match the current versionId,
   * the update is rejected with `ResourceVersionConflictError`.
   *
   * Corresponds to the HTTP `If-Match` header.
   */
  ifMatch?: string;
}

/**
 * Options for history queries.
 */
export interface HistoryOptions {
  /**
   * Only include versions updated after this instant.
   * Corresponds to the `_since` parameter.
   */
  since?: string;

  /**
   * Maximum number of entries to return.
   * Corresponds to the `_count` parameter.
   */
  count?: number;

  /**
   * Cursor for pagination — the `lastUpdated` value of the last
   * entry from the previous page. Only entries with `lastUpdated`
   * strictly before this value are returned.
   */
  cursor?: string;
}

/**
 * A single entry in a history result, including delete markers.
 */
export interface HistoryEntry {
  /** The resource (null for delete entries). */
  resource: PersistedResource | null;
  /** The versionId for this entry. */
  versionId: string;
  /** The timestamp of this version. */
  lastUpdated: string;
  /** Whether this entry represents a deletion. */
  deleted: boolean;
  /** The resource type (needed for delete entries where resource is null). */
  resourceType: string;
  /** The resource id. */
  id: string;
}

// =============================================================================
// Section 3: Search Options
// =============================================================================

/**
 * Options for search execution.
 */
export interface SearchOptions {
  /** Whether to include total count. */
  total?: 'none' | 'estimate' | 'accurate';
}

/**
 * Result of a search execution.
 */
export interface SearchResult {
  /** Matched resources. */
  resources: PersistedResource[];
  /** Included resources from _include/_revinclude (search.mode = 'include'). */
  included?: PersistedResource[];
  /** Total count (only when `total=accurate`). */
  total?: number;
}

// =============================================================================
// Section 4: Repository Interface
// =============================================================================

/**
 * FHIR Resource Repository — persistence contract.
 *
 * All write operations are transactional (ACID).
 * All write operations produce a history entry.
 */
export interface ResourceRepository {
  /**
   * Create a new FHIR resource.
   *
   * - Generates `id` (UUID) if not provided via `options.assignedId`
   * - Generates `meta.versionId` (UUID)
   * - Sets `meta.lastUpdated` to current time
   * - Writes to main table + history table in a transaction
   * - If `context.project` is set, injects projectId into the row
   *
   * @returns The persisted resource with populated `id` and `meta`.
   */
  createResource<T extends FhirResource>(
    resource: T,
    options?: CreateResourceOptions,
    context?: OperationContext,
  ): Promise<T & PersistedResource>;

  /**
   * Read a resource by type and ID.
   *
   * When `context.project` is set, verifies the resource belongs to that project.
   *
   * @throws ResourceNotFoundError if the resource does not exist.
   * @throws ResourceGoneError if the resource has been deleted.
   */
  readResource(resourceType: string, id: string, context?: OperationContext): Promise<PersistedResource>;

  /**
   * Update an existing resource.
   *
   * - The resource must have `id` set.
   * - Generates new `meta.versionId` (UUID)
   * - Sets `meta.lastUpdated` to current time
   * - Writes to main table (UPSERT) + history table in a transaction
   * - If `options.ifMatch` is set, performs optimistic locking check
   * - If `context.project` is set, injects projectId into the row
   *
   * @throws ResourceNotFoundError if the resource does not exist.
   * @throws ResourceGoneError if the resource has been deleted.
   * @throws ResourceVersionConflictError if `ifMatch` does not match.
   */
  updateResource<T extends FhirResource>(
    resource: T,
    options?: UpdateResourceOptions,
    context?: OperationContext,
  ): Promise<T & PersistedResource>;

  /**
   * Soft-delete a resource.
   *
   * - Sets `deleted=true`, `content=''`, `__version=-1`
   * - Writes a delete history entry
   *
   * @throws ResourceNotFoundError if the resource does not exist.
   * @throws ResourceGoneError if already deleted.
   */
  deleteResource(resourceType: string, id: string, context?: OperationContext): Promise<void>;

  /**
   * Read the version history of a resource (newest first).
   */
  readHistory(
    resourceType: string,
    id: string,
    options?: HistoryOptions,
  ): Promise<HistoryEntry[]>;

  /**
   * Read type-level history (all changes to a resource type, newest first).
   */
  readTypeHistory(
    resourceType: string,
    options?: HistoryOptions,
  ): Promise<HistoryEntry[]>;

  /**
   * Read a specific version of a resource.
   *
   * @throws ResourceNotFoundError if the version does not exist.
   */
  readVersion(
    resourceType: string,
    id: string,
    versionId: string,
  ): Promise<PersistedResource>;

  /**
   * Search for resources matching the given search request.
   *
   * - Executes parameterized SQL built from the search request
   * - Optionally returns total count when `options.total === 'accurate'`
   * - If `context.project` is set, adds projectId filter to the query
   *
   * @param request - Parsed FHIR search request.
   * @param options - Search options (e.g., total mode).
   * @param context - Operation context for project scoping.
   * @returns Search result with matched resources and optional total.
   */
  searchResources(
    request: import('../search/types.js').SearchRequest,
    options?: SearchOptions,
    context?: OperationContext,
  ): Promise<SearchResult>;
}

// =============================================================================
// Section 4: Internal Row Types
// =============================================================================

/**
 * Shape of a row in the main resource table.
 *
 * Used internally by `buildResourceRow()` and `sql-builder`.
 */
export interface ResourceRow {
  [key: string]: unknown;
  id: string;
  content: string;
  lastUpdated: string;
  deleted: boolean;
  projectId: string;
  __version: number;
  _source?: string;
  _profile?: string[];
  compartments?: string[];
}

/**
 * Shape of a row in the history table.
 */
export interface HistoryRow {
  [key: string]: unknown;
  id: string;
  versionId: string;
  lastUpdated: string;
  content: string;
}

/**
 * Schema version constant.
 *
 * Tracks the schema migration version (not the resource version).
 * Incremented when the schema structure changes.
 * Set to -1 for deleted resources.
 */
export const SCHEMA_VERSION = 1;

/**
 * Schema version for deleted resources.
 */
export const DELETED_SCHEMA_VERSION = -1;
