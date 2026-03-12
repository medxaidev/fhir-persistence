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
} from './table-schema.js';
