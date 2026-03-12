/**
 * Database Configuration
 *
 * Loads database connection settings from environment variables.
 * Falls back to sensible defaults for local development.
 *
 * @module fhir-persistence/db
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Load database configuration from environment variables.
 *
 * Environment variables:
 * - `DB_HOST` — PostgreSQL host (default: `localhost`)
 * - `DB_PORT` — PostgreSQL port (default: `5433`)
 * - `DB_NAME` — Database name (default: `medxai_dev`)
 * - `DB_USER` — Database user (default: `postgres`)
 * - `DB_PASSWORD` — Database password (default: `assert`)
 */
export function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5433', 10),
    database: process.env['DB_NAME'] ?? 'medxai_dev',
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? 'assert',
  };
}
