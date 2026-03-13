/**
 * Platform IG Definitions — medxai.core
 *
 * In-memory StructureDefinition (as CanonicalProfile) and SearchParameter
 * definitions for MedXAI platform resources: User, Bot, Project, Agent,
 * ClientApplication.
 *
 * These replace the v1 hardcoded PLATFORM_RESOURCE_TYPES approach.
 * Tables are now generated through the IG pipeline (Stage 5).
 *
 * @module fhir-persistence/platform
 */

import type { SearchParameterResource } from '../registry/search-parameter-registry.js';

// =============================================================================
// Section 1: Package Metadata
// =============================================================================

export const PLATFORM_PACKAGE_NAME = 'medxai.core';
export const PLATFORM_PACKAGE_VERSION = '1.0.0';

// =============================================================================
// Section 2: CanonicalProfile-like type (matches @medxai/fhir-core shape)
// =============================================================================

/**
 * Minimal CanonicalProfile shape matching @medxai/fhir-core.
 * We define our own to avoid hard dependency on @medxai/fhir-core at this layer.
 */
export interface PlatformProfile {
  url: string;
  name: string;
  kind: 'resource' | 'complex-type' | 'primitive-type' | 'logical';
  type: string;
  abstract: boolean;
  elements: Map<string, unknown>;
}

// =============================================================================
// Section 3: Platform Resource Profiles
// =============================================================================

const BASE_URL = 'http://medxai.com/fhir/StructureDefinition';

function makeProfile(type: string): PlatformProfile {
  return {
    url: `${BASE_URL}/${type}`,
    name: type,
    kind: 'resource',
    type,
    abstract: false,
    elements: new Map(),
  };
}

export const PLATFORM_PROFILES: PlatformProfile[] = [
  makeProfile('User'),
  makeProfile('Bot'),
  makeProfile('Project'),
  makeProfile('Agent'),
  makeProfile('ClientApplication'),
];

/**
 * Get all platform profiles.
 */
export function getPlatformProfiles(): PlatformProfile[] {
  return [...PLATFORM_PROFILES];
}

/**
 * Get all platform resource type names.
 */
export function getPlatformResourceTypes(): string[] {
  return PLATFORM_PROFILES.map(p => p.type);
}

// =============================================================================
// Section 4: Platform Search Parameters
// =============================================================================

const SP_BASE_URL = 'http://medxai.com/fhir/SearchParameter';

function makeSP(
  resourceType: string,
  code: string,
  type: 'string' | 'token' | 'reference' | 'date',
  expression: string,
): SearchParameterResource {
  return {
    resourceType: 'SearchParameter',
    code,
    type,
    base: [resourceType],
    expression,
    url: `${SP_BASE_URL}/${resourceType}-${code}`,
    name: `${resourceType}-${code}`,
  };
}

export const PLATFORM_SEARCH_PARAMETERS: SearchParameterResource[] = [
  // User — 'email' and 'name' are in LOOKUP_TABLE_PARAMS, so use
  // 'user-email' / 'display-name' codes to avoid lookup-table strategy.
  makeSP('User', 'user-email', 'token', 'User.contact.value'),
  makeSP('User', 'display-name', 'string', 'User.displayName'),
  makeSP('User', 'active', 'token', 'User.active'),

  // Bot
  makeSP('Bot', 'display-name', 'string', 'Bot.displayName'),
  makeSP('Bot', 'identifier', 'token', 'Bot.identifier'),
  makeSP('Bot', 'status', 'token', 'Bot.status'),

  // Project
  makeSP('Project', 'display-name', 'string', 'Project.displayName'),
  makeSP('Project', 'identifier', 'token', 'Project.identifier'),
  makeSP('Project', 'active', 'token', 'Project.active'),

  // Agent
  makeSP('Agent', 'display-name', 'string', 'Agent.displayName'),
  makeSP('Agent', 'status', 'token', 'Agent.status'),
  makeSP('Agent', 'identifier', 'token', 'Agent.identifier'),

  // ClientApplication
  makeSP('ClientApplication', 'display-name', 'string', 'ClientApplication.displayName'),
  makeSP('ClientApplication', 'identifier', 'token', 'ClientApplication.identifier'),
  makeSP('ClientApplication', 'status', 'token', 'ClientApplication.status'),
];

/**
 * Get all platform search parameters.
 */
export function getPlatformSearchParameters(): SearchParameterResource[] {
  return [...PLATFORM_SEARCH_PARAMETERS];
}

/**
 * Get search parameters for a specific platform resource type.
 */
export function getSearchParametersForType(resourceType: string): SearchParameterResource[] {
  return PLATFORM_SEARCH_PARAMETERS.filter(sp => sp.base.includes(resourceType));
}

// =============================================================================
// Section 5: Checksum
// =============================================================================

/**
 * Generate a deterministic checksum for the platform IG package.
 * Based on sorted JSON of profiles + search parameters.
 */
export function getPackageChecksum(): string {
  const data = JSON.stringify({
    profiles: PLATFORM_PROFILES.map(p => ({ url: p.url, type: p.type })),
    searchParameters: PLATFORM_SEARCH_PARAMETERS.map(sp => ({
      url: sp.url, code: sp.code, type: sp.type, base: sp.base, expression: sp.expression,
    })),
    version: PLATFORM_PACKAGE_VERSION,
  });
  // Simple hash for deterministic checksum (not cryptographic)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return `medxai-core-${PLATFORM_PACKAGE_VERSION}-${Math.abs(hash).toString(16)}`;
}
