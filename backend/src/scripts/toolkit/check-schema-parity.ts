import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  checkRequiredColumns,
  isValidSchemaIdentifier,
  resolveTargetSchema,
  TableRequirement,
} from '../../toolkit/core/database-schema.util';

const REQUIRED_COLUMNS: TableRequirement[] = [
  { table: 'campaigns', columns: ['is_mock_data', 'source'] },
  { table: 'metrics', columns: ['is_mock_data', 'source'] },
];

function maskDatabaseHost(databaseUrl?: string): string {
  if (!databaseUrl) return 'MISSING_DATABASE_URL';
  try {
    const host = new URL(databaseUrl).hostname;
    if (host.length <= 8) return host;
    return `${host.slice(0, 4)}***${host.slice(-4)}`;
  } catch {
    return 'INVALID_DATABASE_URL';
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const schemaResolution = resolveTargetSchema(process.env.DATABASE_URL);
  const targetSchema = schemaResolution.schema;

  if (!isValidSchemaIdentifier(targetSchema)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          checkedAt: new Date().toISOString(),
          dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
          schema: targetSchema,
          error: `Invalid schema identifier "${targetSchema}"`,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  try {
    const { checks, missing } = await checkRequiredColumns(
      prisma,
      targetSchema,
      REQUIRED_COLUMNS,
    );

    const ok = missing.length === 0;
    console.log(
      JSON.stringify(
        {
          ok,
          checkedAt: new Date().toISOString(),
          dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
          schema: targetSchema,
          schemaSource: schemaResolution.source,
          checks,
          missing,
        },
        null,
        2,
      ),
    );

    process.exit(ok ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          ok: false,
          checkedAt: new Date().toISOString(),
          dbHostMasked: maskDatabaseHost(process.env.DATABASE_URL),
          schema: targetSchema,
          schemaSource: schemaResolution.source,
          error: message,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
