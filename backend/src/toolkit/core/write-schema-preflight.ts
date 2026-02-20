import { PrismaClient } from '@prisma/client';
import { ToolkitError } from './contracts';
import {
    checkRequiredColumns,
    isValidSchemaIdentifier,
    resolveTargetSchema,
    TableRequirement,
} from './database-schema.util';

const TOOLKIT_WRITE_REQUIREMENTS: TableRequirement[] = [
    { table: 'campaigns', columns: ['is_mock_data', 'source'] },
    { table: 'metrics', columns: ['is_mock_data', 'source'] },
];

export class SchemaParityPreflightError extends ToolkitError {
    readonly code = 'SCHEMA_PARITY_VIOLATION';
    readonly isRecoverable = false;
}

export async function assertToolkitWriteSchemaParity(
    prisma: PrismaClient,
): Promise<void> {
    const schemaResolution = resolveTargetSchema(process.env.DATABASE_URL);
    const targetSchema = schemaResolution.schema;

    if (!isValidSchemaIdentifier(targetSchema)) {
        throw new SchemaParityPreflightError(
            `Database schema parity failed. Invalid schema identifier "${targetSchema}".`,
        );
    }

    const { missing } = await checkRequiredColumns(
        prisma,
        targetSchema,
        TOOLKIT_WRITE_REQUIREMENTS,
    );

    if (missing.length > 0) {
        throw new SchemaParityPreflightError(
            `Database schema parity failed for schema "${targetSchema}". ` +
            `Missing required columns: ${missing.join(', ')}. ` +
            'Apply Prisma migrations before running toolkit write commands.',
        );
    }
}
