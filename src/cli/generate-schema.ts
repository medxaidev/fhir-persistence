/**
 * CLI Entry Point — Schema Generation
 *
 * Generates PostgreSQL DDL from FHIR R4 StructureDefinitions and
 * SearchParameters. Outputs to stdout or file.
 *
 * ## Usage
 *
 * ```
 * npx ts-node src/cli/generate-schema.ts [options]
 *
 * Options:
 *   --spec-dir <path>    Path to spec/fhir/r4/ directory (default: ./spec/fhir/r4)
 *   --output <path>      Output file path (default: stdout)
 *   --resource <type>    Generate DDL for single resource type only
 *   --format text|json   Output format (default: text)
 *   --version <string>   Schema version string (default: fhir-r4-v4.0.1)
 * ```
 *
 * @module fhir-persistence/cli
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { StructureDefinitionRegistry } from '../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../registry/search-parameter-registry.js';
import {
  buildResourceTableSet,
  buildSchemaDefinition,
} from '../schema/table-schema-builder.js';
import {
  generateResourceDDL,
  generateSchemaDDLString,
} from '../schema/ddl-generator.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Argument Parsing
// =============================================================================

interface CliOptions {
  specDir: string;
  output: string | null;
  resource: string | null;
  format: 'text' | 'json';
  version: string;
  dialect: DDLDialect;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    specDir: resolve(process.cwd(), 'spec', 'fhir', 'r4'),
    output: null,
    resource: null,
    format: 'text',
    version: 'fhir-r4-v4.0.1',
    dialect: 'sqlite',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--spec-dir':
        options.specDir = resolve(args[++i]);
        break;
      case '--output':
        options.output = resolve(args[++i]);
        break;
      case '--resource':
        options.resource = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'text' | 'json';
        break;
      case '--version':
        options.version = args[++i];
        break;
      case '--dialect':
        options.dialect = args[++i] as DDLDialect;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Usage: generate-schema [options]

Options:
  --spec-dir <path>    Path to spec/fhir/r4/ directory (default: ./spec/fhir/r4)
  --output <path>      Output file path (default: stdout)
  --resource <type>    Generate DDL for single resource type only
  --format text|json   Output format (default: text)
  --version <string>   Schema version string (default: fhir-r4-v4.0.1)
  --dialect <string>   Database dialect: sqlite | postgres (default: sqlite)
  --help, -h           Show this help message
`);
}

// =============================================================================
// Section 2: Main Pipeline
// =============================================================================

/**
 * Run the schema generation pipeline.
 *
 * Exported for testing; the CLI calls this with `process.argv`.
 */
export function run(args: string[]): string {
  const options = parseArgs(args);

  // Resolve platform directory relative to spec-dir
  // spec-dir is typically <root>/spec/fhir/r4, platform is <root>/spec/platform
  const platformDir = resolve(options.specDir, '..', '..', 'platform');

  // 1. Load StructureDefinitions (FHIR R4 + MedXAI platform)
  const sdRegistry = new StructureDefinitionRegistry();
  const bundleFiles = [
    resolve(options.specDir, 'profiles-resources.json'),
    resolve(platformDir, 'profiles-medxai.json'),
  ];
  for (const file of bundleFiles) {
    try {
      const bundle = JSON.parse(readFileSync(file, 'utf8'));
      const entries = (bundle?.entry ?? []) as Array<{ resource?: Record<string, unknown> }>;
      for (const entry of entries) {
        if (entry.resource?.resourceType === 'StructureDefinition') {
          sdRegistry.index(entry.resource as never);
        }
      }
    } catch {
      // File may not exist (e.g., platform profiles)
    }
  }

  // 2. Load SearchParameters (FHIR R4 + MedXAI platform)
  const spPath = resolve(options.specDir, 'search-parameters.json');
  const spBundle = JSON.parse(
    readFileSync(spPath, 'utf8'),
  ) as SearchParameterBundle;

  const spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(spBundle);

  const platformSpBundle = JSON.parse(
    readFileSync(resolve(platformDir, 'search-parameters-medxai.json'), 'utf8'),
  ) as SearchParameterBundle;
  spRegistry.indexBundle(platformSpBundle);

  // 3. Generate schema
  let output: string;

  if (options.resource) {
    // Single resource mode
    const tableSet = buildResourceTableSet(options.resource, sdRegistry, spRegistry);
    if (options.format === 'json') {
      output = JSON.stringify(tableSet, null, 2);
    } else {
      const statements = generateResourceDDL(tableSet, options.dialect);
      output = statements.join('\n\n') + '\n';
    }
  } else {
    // Full schema mode
    const schema = buildSchemaDefinition(sdRegistry, spRegistry, options.version);
    if (options.format === 'json') {
      output = JSON.stringify(schema, null, 2);
    } else {
      output = generateSchemaDDLString(schema, options.dialect);
    }
  }

  // 4. Output
  if (options.output) {
    writeFileSync(options.output, output, 'utf8');
    console.log(`Schema written to ${options.output}`);
  }

  return output;
}

// =============================================================================
// Section 3: CLI Entry Point
// =============================================================================

// Only run if this file is executed directly (not imported)
const isMainModule = process.argv[1]?.endsWith('generate-schema.ts') ||
  process.argv[1]?.endsWith('generate-schema.js') ||
  process.argv[1]?.endsWith('generate-schema.mjs');

if (isMainModule) {
  const args = process.argv.slice(2);
  const output = run(args);
  if (!args.includes('--output')) {
    process.stdout.write(output);
  }
}
