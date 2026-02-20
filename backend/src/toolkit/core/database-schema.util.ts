import { Prisma, PrismaClient } from '@prisma/client';

export type TableRequirement = {
    table: string;
    columns: string[];
};

export type SchemaResolution = {
    schema: string;
    source: 'url' | 'default' | 'invalid_url';
};

const DEFAULT_SCHEMA = 'public';
const SCHEMA_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function resolveTargetSchema(databaseUrl?: string): SchemaResolution {
    if (!databaseUrl) {
        return { schema: DEFAULT_SCHEMA, source: 'default' };
    }

    try {
        const parsed = new URL(databaseUrl);
        const schema = parsed.searchParams.get('schema')?.trim();
        if (schema && schema.length > 0) {
            return { schema, source: 'url' };
        }
        return { schema: DEFAULT_SCHEMA, source: 'default' };
    } catch {
        return { schema: DEFAULT_SCHEMA, source: 'invalid_url' };
    }
}

export function isValidSchemaIdentifier(schema: string): boolean {
    return SCHEMA_IDENTIFIER_REGEX.test(schema);
}

export async function getMissingColumns(
    prisma: PrismaClient,
    schema: string,
    table: string,
    requiredColumns: string[],
): Promise<string[]> {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>(
        Prisma.sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = ${table}
              AND column_name IN (${Prisma.join(requiredColumns)})
        `,
    );

    const present = new Set(rows.map((row) => row.column_name));
    return requiredColumns.filter((column) => !present.has(column));
}

export async function checkRequiredColumns(
    prisma: PrismaClient,
    schema: string,
    requirements: TableRequirement[],
): Promise<{
    checks: Array<{ table: string; required: string[]; missing: string[] }>;
    missing: string[];
}> {
    const checks: Array<{ table: string; required: string[]; missing: string[] }> = [];
    const missing: string[] = [];

    for (const requirement of requirements) {
        const missingColumns = await getMissingColumns(
            prisma,
            schema,
            requirement.table,
            requirement.columns,
        );

        checks.push({
            table: requirement.table,
            required: requirement.columns,
            missing: missingColumns,
        });

        for (const column of missingColumns) {
            missing.push(`${requirement.table}.${column}`);
        }
    }

    return { checks, missing };
}
