/**
 * SQLiteDialect — SQLite-Specific SQL Generation
 *
 * Implements SqlDialect for SQLite syntax differences:
 * - `?` placeholders (not `$1`)
 * - JSON arrays instead of native TEXT[]
 * - TEXT instead of TIMESTAMPTZ
 * - INTEGER instead of BOOLEAN
 * - json_each() for array contains checks
 *
 * v2 upgrade: New file. v1 hardcoded PostgreSQL syntax.
 *
 * @module fhir-persistence/db
 */

import type { SqlDialect } from './dialect.js';

export class SQLiteDialect implements SqlDialect {
  readonly name = 'sqlite' as const;

  placeholder(_index: number): string {
    return '?';
  }

  textArrayContains(column: string, paramCount: number, _paramStartIndex: number): {
    sql: string;
    values: unknown[];
  } {
    const placeholders = Array.from({ length: paramCount }, () => '?').join(', ');
    return {
      sql: `EXISTS (SELECT 1 FROM json_each("${column}") WHERE value IN (${placeholders}))`,
      values: [],  // caller supplies values separately
    };
  }

  like(column: string, _paramIndex: number): string {
    return `"${column}" LIKE ? ESCAPE '\\'`;
  }

  limitOffset(_paramStartIndex: number): { sql: string } {
    return { sql: 'LIMIT ? OFFSET ?' };
  }

  arrayLiteral(values: string[]): string {
    return JSON.stringify(values);
  }

  timestampType(): string {
    return 'TEXT';
  }

  booleanType(): string {
    return 'INTEGER';
  }

  textArrayType(): string {
    return 'TEXT';
  }

  upsertSuffix(conflictColumn: string, updateColumns: string[]): string {
    const sets = updateColumns.map(c => `"${c}" = excluded."${c}"`).join(', ');
    return `ON CONFLICT("${conflictColumn}") DO UPDATE SET ${sets}`;
  }

  autoIncrementPK(): string {
    return 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT';
  }
}
