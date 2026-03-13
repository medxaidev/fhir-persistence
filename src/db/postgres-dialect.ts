/**
 * PostgresDialect — PostgreSQL-Specific SQL Generation
 *
 * Implements SqlDialect for PostgreSQL syntax:
 * - `$1, $2, ...` positional placeholders
 * - Native TEXT[] arrays with `&& ARRAY[...]::text[]`
 * - TIMESTAMPTZ for timestamps
 * - BOOLEAN for booleans
 * - GIN indexes for array contains
 * - GENERATED ALWAYS AS IDENTITY for auto-increment
 *
 * v2 upgrade: New file. v1 hardcoded PG syntax in business logic.
 * Now encapsulated in this dialect object.
 *
 * @module fhir-persistence/db
 */

import type { SqlDialect } from './dialect.js';

export class PostgresDialect implements SqlDialect {
  readonly name = 'postgres' as const;

  placeholder(index: number): string {
    return `$${index}`;
  }

  textArrayContains(column: string, paramCount: number, paramStartIndex: number): {
    sql: string;
    values: unknown[];
  } {
    const placeholders = Array.from(
      { length: paramCount },
      (_, i) => `$${paramStartIndex + i}`,
    ).join(', ');
    return {
      sql: `"${column}" && ARRAY[${placeholders}]::text[]`,
      values: [], // caller supplies values separately
    };
  }

  like(column: string, paramIndex: number): string {
    return `"${column}" LIKE $${paramIndex}`;
  }

  limitOffset(paramStartIndex: number): { sql: string } {
    return { sql: `LIMIT $${paramStartIndex} OFFSET $${paramStartIndex + 1}` };
  }

  arrayLiteral(values: string[]): string {
    if (values.length === 0) {
      return 'ARRAY[]::text[]';
    }
    const escaped = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
    return `ARRAY[${escaped}]::text[]`;
  }

  timestampType(): string {
    return 'TIMESTAMPTZ';
  }

  booleanType(): string {
    return 'BOOLEAN';
  }

  textArrayType(): string {
    return 'TEXT[]';
  }

  upsertSuffix(conflictColumn: string, updateColumns: string[]): string {
    const sets = updateColumns.map(c => `"${c}" = excluded."${c}"`).join(', ');
    return `ON CONFLICT("${conflictColumn}") DO UPDATE SET ${sets}`;
  }

  autoIncrementPK(): string {
    return 'INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY';
  }
}
