/**
 * Schema module — barrel exports
 *
 * @module fhir-persistence/schema
 */

export type {
  SqlColumnType,
  ColumnSchema,
  IndexSchema,
  ConstraintSchema,
  MainTableSchema,
  HistoryTableSchema,
  ReferencesTableSchema,
  ResourceTableSet,
  SchemaDefinition,
  SearchParamMeta,
  GlobalLookupTableSchema,
  LookupTableType,
} from './table-schema.js';

export type { DDLDialect } from './ddl-generator.js';
