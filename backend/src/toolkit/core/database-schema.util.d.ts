import { PrismaClient } from '@prisma/client';
export type TableRequirement = {
    table: string;
    columns: string[];
};
export type SchemaResolution = {
    schema: string;
    source: 'url' | 'default' | 'invalid_url';
};
export declare function resolveTargetSchema(databaseUrl?: string): SchemaResolution;
export declare function isValidSchemaIdentifier(schema: string): boolean;
export declare function getMissingColumns(prisma: PrismaClient, schema: string, table: string, requiredColumns: string[]): Promise<string[]>;
export declare function checkRequiredColumns(prisma: PrismaClient, schema: string, requirements: TableRequirement[]): Promise<{
    checks: Array<{
        table: string;
        required: string[];
        missing: string[];
    }>;
    missing: string[];
}>;
