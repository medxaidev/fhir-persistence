/**
 * Platform IG Loader — medxai.core
 *
 * Loads platform resource definitions, builds ResourceTableSets,
 * and feeds them into the IGPersistenceManager pipeline for
 * automatic table creation and migration.
 *
 * @module fhir-persistence/platform
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { ResourceTableSet } from '../schema/table-schema.js';
import { StructureDefinitionRegistry } from '../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import { buildResourceTableSet } from '../schema/table-schema-builder.js';
import { IGPersistenceManager } from '../migration/ig-persistence-manager.js';
import type { IGInitResult } from '../migration/ig-persistence-manager.js';
import {
  getPlatformProfiles,
  getPlatformSearchParameters,
  getPackageChecksum,
  PLATFORM_PACKAGE_NAME,
  PLATFORM_PACKAGE_VERSION,
} from './platform-ig-definitions.js';

// =============================================================================
// Section 1: Build Platform Table Sets
// =============================================================================

/**
 * Build ResourceTableSets for all platform resource types.
 *
 * Uses StructureDefinitionRegistry + SearchParameterRegistry
 * populated with platform definitions to generate the table schemas.
 */
export function buildPlatformTableSets(): ResourceTableSet[] {
  const sdRegistry = new StructureDefinitionRegistry();
  const spRegistry = new SearchParameterRegistry();

  // Index platform profiles
  const profiles = getPlatformProfiles();
  // StructureDefinitionRegistry expects CanonicalProfile from @medxai/fhir-core
  // Our PlatformProfile matches the same shape
  sdRegistry.indexAll(profiles as never[]);

  // Index platform search parameters as a bundle
  const searchParams = getPlatformSearchParameters();
  spRegistry.indexBundle({
    resourceType: 'Bundle',
    entry: searchParams.map(sp => ({ resource: sp })),
  });

  // Build table sets for each platform resource type
  const tableSets: ResourceTableSet[] = [];
  for (const profile of profiles) {
    const tableSet = buildResourceTableSet(profile.type, sdRegistry, spRegistry);
    tableSets.push(tableSet);
  }

  return tableSets;
}

// =============================================================================
// Section 2: Initialize Platform IG
// =============================================================================

/**
 * Initialize the platform IG — create or upgrade platform resource tables.
 *
 * This is the main entry point for bootstrapping platform tables on startup.
 * Uses IGPersistenceManager for checksum-based change detection.
 *
 * @param adapter - StorageAdapter (SQLite or PostgreSQL).
 * @returns IGInitResult with action taken (new/upgrade/consistent).
 */
export async function initializePlatformIG(adapter: StorageAdapter): Promise<IGInitResult> {
  const tableSets = buildPlatformTableSets();
  const checksum = getPackageChecksum();

  const manager = new IGPersistenceManager(adapter, 'sqlite');
  return manager.initialize({
    name: PLATFORM_PACKAGE_NAME,
    version: PLATFORM_PACKAGE_VERSION,
    checksum,
    tableSets,
  });
}
