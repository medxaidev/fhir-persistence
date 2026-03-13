/**
 * Migration Generator — v2
 *
 * Generates SQL DDL statements from SchemaDelta[].
 * Dialect-aware: produces SQLite or PostgreSQL DDL.
 *
 * Key design decisions:
 * - ADD_TABLE delegates to existing DDLGenerator (generateResourceDDL)
 * - ADD_COLUMN → ALTER TABLE ADD COLUMN
 * - DROP_COLUMN → ALTER TABLE DROP COLUMN (PG only; SQLite ignores)
 * - ADD_INDEX → CREATE INDEX IF NOT EXISTS
 * - DROP_INDEX → DROP INDEX IF EXISTS
 * - REINDEX → no DDL (metadata only, handled by ReindexScheduler)
 * - ALTER_COLUMN → not supported in SQLite (logged as warning)
 *
 * @module fhir-persistence/migration
 */

import type { SchemaDelta } from './schema-diff.js';
import type { DDLDialect } from '../schema/ddl-generator.js';
import {
  generateResourceDDL,
  generateCreateIndex,
} from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface GeneratedMigration {
  /** SQL statements to apply (up). */
  up: string[];
  /** SQL statements to revert (down). Best-effort; some are irreversible. */
  down: string[];
  /** Deltas that require reindex (no DDL, just scheduling). */
  reindexDeltas: SchemaDelta[];
  /** Human-readable description of changes. */
  description: string;
}

// =============================================================================
// Section 2: Generate Migration
// =============================================================================

/**
 * Generate SQL DDL from a list of schema deltas.
 *
 * @param deltas - Schema changes to apply.
 * @param dialect - Target SQL dialect.
 * @returns Generated migration with up/down SQL and reindex info.
 */
export function generateMigration(
  deltas: SchemaDelta[],
  dialect: DDLDialect,
): GeneratedMigration {
  const up: string[] = [];
  const down: string[] = [];
  const reindexDeltas: SchemaDelta[] = [];
  const descriptions: string[] = [];

  for (const delta of deltas) {
    switch (delta.kind) {
      case 'ADD_TABLE': {
        if (delta.tableSet) {
          const ddlStatements = generateResourceDDL(delta.tableSet, dialect);
          up.push(...ddlStatements);
          // Down: drop all 3 tables
          down.push(
            `DROP TABLE IF EXISTS "${delta.resourceType}_References";`,
            `DROP TABLE IF EXISTS "${delta.resourceType}_History";`,
            `DROP TABLE IF EXISTS "${delta.resourceType}";`,
          );
          descriptions.push(`Add table ${delta.resourceType}`);
        }
        break;
      }

      case 'DROP_TABLE': {
        up.push(
          `DROP TABLE IF EXISTS "${delta.resourceType}_References";`,
          `DROP TABLE IF EXISTS "${delta.resourceType}_History";`,
          `DROP TABLE IF EXISTS "${delta.resourceType}";`,
        );
        // Down: cannot restore (forward-only for IG migrations)
        descriptions.push(`Drop table ${delta.resourceType}`);
        break;
      }

      case 'ADD_COLUMN': {
        if (delta.column) {
          const typeName = mapColumnTypeForDialect(delta.column.type, dialect);
          let ddl = `ALTER TABLE "${delta.tableName}" ADD COLUMN "${delta.column.name}" ${typeName}`;
          if (delta.column.notNull && delta.column.defaultValue !== undefined) {
            ddl += ` NOT NULL DEFAULT ${delta.column.defaultValue}`;
          }
          ddl += ';';
          up.push(ddl);

          // Down: DROP COLUMN (PG only, SQLite doesn't support it pre-3.35)
          if (dialect === 'postgres') {
            down.push(`ALTER TABLE "${delta.tableName}" DROP COLUMN IF EXISTS "${delta.column.name}";`);
          }
          descriptions.push(`Add column ${delta.tableName}.${delta.column.name}`);
        }
        break;
      }

      case 'DROP_COLUMN': {
        if (delta.column) {
          if (dialect === 'postgres') {
            up.push(`ALTER TABLE "${delta.tableName}" DROP COLUMN IF EXISTS "${delta.column.name}";`);
          }
          // SQLite: DROP COLUMN supported since 3.35.0
          if (dialect === 'sqlite') {
            up.push(`ALTER TABLE "${delta.tableName}" DROP COLUMN "${delta.column.name}";`);
          }
          descriptions.push(`Drop column ${delta.tableName}.${delta.column.name}`);
        }
        break;
      }

      case 'ADD_INDEX': {
        if (delta.index) {
          const sql = generateCreateIndex(delta.index, delta.tableName, dialect);
          if (sql) {
            up.push(sql);
            down.push(`DROP INDEX IF EXISTS "${delta.index.name}";`);
          }
          descriptions.push(`Add index ${delta.index.name}`);
        }
        break;
      }

      case 'DROP_INDEX': {
        if (delta.index) {
          up.push(`DROP INDEX IF EXISTS "${delta.index.name}";`);
          descriptions.push(`Drop index ${delta.index.name}`);
        }
        break;
      }

      case 'ALTER_COLUMN': {
        // SQLite doesn't support ALTER COLUMN type changes
        // PG: ALTER TABLE ... ALTER COLUMN ... TYPE ...
        if (dialect === 'postgres' && delta.column) {
          up.push(
            `ALTER TABLE "${delta.tableName}" ALTER COLUMN "${delta.column.name}" TYPE ${delta.column.type};`,
          );
          if (delta.oldColumn) {
            down.push(
              `ALTER TABLE "${delta.tableName}" ALTER COLUMN "${delta.column.name}" TYPE ${delta.oldColumn.type};`,
            );
          }
          descriptions.push(`Alter column ${delta.tableName}.${delta.column.name} type`);
        }
        break;
      }

      case 'REINDEX': {
        reindexDeltas.push(delta);
        descriptions.push(`Reindex ${delta.resourceType} for SP ${delta.searchParam?.code ?? '?'}`);
        break;
      }
    }
  }

  return {
    up,
    down,
    reindexDeltas,
    description: descriptions.join('; ') || 'No changes',
  };
}

// =============================================================================
// Section 3: Type Mapping Helper
// =============================================================================

/**
 * Map a logical SqlColumnType to dialect-specific string.
 * Mirrors DDLGenerator.mapColumnType but exported for migration use.
 */
function mapColumnTypeForDialect(type: string, dialect: DDLDialect): string {
  if (dialect === 'postgres') return type;

  switch (type) {
    case 'BOOLEAN': return 'INTEGER';
    case 'TIMESTAMPTZ': return 'TEXT';
    case 'TIMESTAMPTZ[]': return 'TEXT';
    case 'TEXT[]': return 'TEXT';
    case 'DOUBLE PRECISION': return 'REAL';
    case 'DOUBLE PRECISION[]': return 'TEXT';
    case 'DATE': return 'TEXT';
    case 'DATE[]': return 'TEXT';
    case 'NUMERIC': return 'REAL';
    case 'BIGINT': return 'INTEGER';
    default: return type;
  }
}
